export default function hasPendingAction(pendingActions, actionType) {
    return !!pendingActions.get(actionType.toString());
}
