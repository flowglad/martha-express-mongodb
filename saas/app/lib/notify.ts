import { openSnackbarExternal } from '../components/common/Notifier';

export default function notify(obj) {
  openSnackbarExternal({ message: obj.message || obj.toString() ,
    autoHideDuration: obj.duration || 6000, // default to 6 seconds
  });
}
