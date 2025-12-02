import * as mongoose from 'mongoose';

import Team from './Team';
import User, { UserDocument } from './User';
import { generateSlug } from '../utils/slugify';

const mongoSchema = new mongoose.Schema({
  teamId: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 60 * 60 * 24, // delete doc after 24 hours
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
});

mongoSchema.index({ teamId: 1, email: 1 }, { unique: true });

interface InvitationDocument extends mongoose.Document {
  teamId: string;
  email: string;
  createdAt: Date;
  token: string;
}

interface InvitationModel extends mongoose.Model<InvitationDocument> {
  add({
    userId,
    teamId,
    email,
  }: {
    userId: string;
    teamId: string;
    email: string;
  }): InvitationDocument;

  getTeamInvitations({ userId, teamId }: { userId: string; teamId: string });
  getTeamByToken({ token }: { token: string });
  addUserToTeam({ token, user }: { token: string; user: UserDocument });
}

class InvitationClass extends mongoose.Model {
  public static async add({ userId, teamId, email }) {
    if (!teamId || !email) {
      throw new Error('Bad data');
    }

    const team = await Team.findById(teamId).setOptions({ lean: true });
    if (!team || team.teamLeaderId !== userId) {
      throw new Error('Team does not exist or you have no permission');
    }

    let registeredUser = await User.findOne({ email }).setOptions({ lean: true });

    // If user doesn't exist, create a test user account for them
    if (!registeredUser) {
      const slug = await generateSlug(User, email);
      const userIdForNewUser = new mongoose.Types.ObjectId().toHexString();

      const newUser = await User.create({
        _id: userIdForNewUser,
        createdAt: new Date(),
        email,
        slug,
        displayName: email.split('@')[0], // Use email prefix as display name
        defaultTeamSlug: '',
        isSignedupViaGoogle: false,
        darkTheme: false,
      });

      registeredUser = await User.findById(newUser._id)
        .select(User.publicFields().join(' '))
        .setOptions({ lean: true });
    }

    if (team.memberIds.includes(registeredUser._id.toString())) {
      throw new Error('This user is already a Team Member.');
    }

    // Add user directly to team without sending email
    await Team.updateOne({ _id: team._id }, { $addToSet: { memberIds: registeredUser._id.toString() } });

    // Set default team slug if user doesn't have one
    if (registeredUser._id.toString() !== team.teamLeaderId) {
      await User.findByIdAndUpdate(registeredUser._id, { $set: { defaultTeamSlug: team.slug } });
    }

    // Return a mock invitation object for compatibility with frontend
    return {
      _id: 'direct-add',
      teamId,
      email,
      token: 'direct-add',
      createdAt: new Date(),
    };
  }

  public static async getTeamInvitations({ userId, teamId }) {
    const team = await Team.findOne({ _id: teamId })
      .select('teamLeaderId')
      .setOptions({ lean: true });

    if (userId !== team.teamLeaderId) {
      throw new Error('You have no permission.');
    }

    return this.find({ teamId }).select('email').setOptions({ lean: true });
  }

  public static async getTeamByToken({ token }) {
    if (!token) {
      throw new Error('Bad data');
    }

    const invitation = await this.findOne({ token }).setOptions({ lean: true });

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    const team = await Team.findById(invitation.teamId)
      .select('name slug avatarUrl memberIds')
      .setOptions({ lean: true });

    if (!team) {
      throw new Error('Team does not exist');
    }

    return team;
  }

  public static async addUserToTeam({ token, user }) {
    if (!token || !user) {
      throw new Error('Bad data');
    }

    const invitation = await this.findOne({ token }).setOptions({ lean: true });

    if (!invitation || invitation.email !== user.email) {
      throw new Error('Invitation not found');
    }

    await this.deleteOne({ token });

    const team = await Team.findById(invitation.teamId)
      .select('memberIds slug teamLeaderId')
      .setOptions({ lean: true });

    if (!team) {
      throw new Error('Team does not exist');
    }

    if (team && !team.memberIds.includes(user._id)) {
      await Team.updateOne({ _id: team._id }, { $addToSet: { memberIds: user._id } });

      if (user._id !== team.teamLeaderId) {
        await User.findByIdAndUpdate(user._id, { $set: { defaultTeamSlug: team.slug } });
      }
    }

    return team.slug;
  }
}

mongoSchema.loadClass(InvitationClass);

const Invitation = mongoose.model<InvitationDocument, InvitationModel>('Invitation', mongoSchema);

export default Invitation;
