export default {
    Creating: 0,
    Created: 1,
    NightStart: 2, // 天黑了
    KillersConfirmEachOther: 3, // 狼人请确认身份(天黑了)
    KillersKilling: 4, // 狼人请杀人
    WitchCuring: 5, // 女巫请确认是否救人
    WitchPosioning: 6, // 女巫请确认是否毒死一个人
    PredictorChecking: 7, // 预言家请查看一个人的身份
    Sunrise: 8, // 天亮了
    Voting: 9, // 投票
    VoteEnd: 10, // 投票结束

    KillersWin: 11, // 狼人获胜
    VillagersWin: 12 // 村民方获胜
}
