export default {
    Creating: 0,
    WaitingAction: 1, // 天亮了/游戏开局
    KillersConfirmEachOther: 2, // 狼人请确认身份(天黑了)
    KillersKilling: 3, // 狼人请杀人
    WitchCuring: 4, // 女巫请确认是否救人
    WitchPosioning: 5, // 女巫请确认是否毒死一个人
    PredictorChecking: 6 // 预言家请查看一个人的身份
}
