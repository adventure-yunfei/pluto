const EnumPlayerRole = {
    NotSet: 0,
    Villager: 1,
    Killer: 2,
    Witch: 3,
    Predictor: 4,
    Hunter: 5
};

export default EnumPlayerRole;

export const PlayRoleLabels = {
    [EnumPlayerRole.NotSet]: '待定',
    [EnumPlayerRole.Villager]: '村民',
    [EnumPlayerRole.Killer]: '狼人',
    [EnumPlayerRole.Witch]: '女巫',
    [EnumPlayerRole.Predictor]: '预言家',
    [EnumPlayerRole.Hunter]: '猎人'
};
