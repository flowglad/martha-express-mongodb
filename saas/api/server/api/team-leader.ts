import * as express from 'express';

import Invitation from '../models/Invitation';
import Team from '../models/Team';
import User from '../models/User';

const router = express.Router();

router.use((req, res, next) => {
  console.log('team leader API', req.path);

  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next();
});

router.post('/teams/add', async (req: any, res, next) => {
  try {
    const { name, avatarUrl } = req.body;

    console.log(`Express route: ${name}, ${avatarUrl}`);

    const team = await Team.addTeam({ userId: req.user.id, name, avatarUrl });

    res.json(team);
  } catch (err) {
    next(err);
  }
});

router.post('/teams/update', async (req: any, res, next) => {
  try {
    const { teamId, name, avatarUrl } = req.body;

    // console.log(req.user.id, typeof req.user.id);
    // console.log(req.user._id, typeof req.user._id);

    const team = await Team.updateTeam({
      userId: req.user.id,
      teamId,
      name,
      avatarUrl,
    });

    res.json(team);
  } catch (err) {
    next(err);
  }
});

router.get('/teams/get-invitations-for-team', async (req: any, res, next) => {
  try {
    const invitations = await Invitation.getTeamInvitations({
      userId: req.user.id,
      teamId: req.query.teamId as string,
    });

    res.json({ invitations });
  } catch (err) {
    next(err);
  }
});

router.post('/teams/invite-member', async (req: any, res, next) => {
  try {
    const { teamId, email } = req.body;

    await Invitation.add({ userId: req.user.id, teamId, email });

    // Get updated team with new member
    const team = await Team.findById(teamId).setOptions({ lean: true });
    
    // Get the newly added user
    const addedUser = await User.findOne({ email })
      .select(User.publicFields().join(' '))
      .setOptions({ lean: true });

    res.json({ user: addedUser, team });
  } catch (err) {
    next(err);
  }
});

router.post('/teams/remove-member', async (req: any, res, next) => {
  try {
    const { teamId, userId } = req.body;

    await Team.removeMember({ teamLeaderId: req.user.id, teamId, userId });

    res.json({ done: 1 });
  } catch (err) {
    next(err);
  }
});

router.post('/stripe/fetch-checkout-session', async (_req: any, res, next) => {
  // TODO: Integrate with billing provider to create checkout session
  // Placeholder response for now
  try {
    res.json({ sessionId: 'placeholder-session-id' });
  } catch (err) {
    next(err);
  }
});

router.post('/cancel-subscription', async (_req: any, res, next) => {
  // TODO: Integrate with billing provider to cancel subscription
  // Placeholder response for now
  try {
    res.json({ isSubscriptionActive: false });
  } catch (err) {
    next(err);
  }
});

router.get('/get-list-of-invoices-for-customer', async (_req: any, res, next) => {
  // TODO: Integrate with billing provider to fetch invoices
  // Placeholder response for now
  try {
    res.json({
      stripeListOfInvoices: {
        object: 'list',
        data: [],
        has_more: false,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
