import R from 'ramda';

export function getVoteResult(roomVoting) {
    const beVotedUidCntMap = roomVoting.reduce((result, {uid, targetUid}) => {
        if (targetUid) {
            result[targetUid] = (result[targetUid] || 0) + 1;
        }
        return result;
    }, {});

    const voteRank = R.compose(
        R.reverse,
        R.sortBy(R.prop('voteCount')),
        R.map(uid => ({uid: uid, voteCount: beVotedUidCntMap[uid]})),
        R.keys
    )(beVotedUidCntMap);

    let highestVotedUid = null;
    if (voteRank.length === 1 || (voteRank.length >= 2 && voteRank[0].voteCount > voteRank[1].voteCount)) {
        highestVotedUid = voteRank[0].uid;
    }
    const firstVote = R.compose(
        R.defaultTo({}),
        R.head
    )(voteRank);
    const highestVotedUids = R.compose(
        R.map(R.prop('uid')),
        R.filter(R.eqProps('voteCount', firstVote))
    )(voteRank);

    return {
        sortedResult: voteRank,
        votedCountMap: beVotedUidCntMap,
        highestVotedUid: highestVotedUid,
        highestVotedUids: highestVotedUids
    };
}
