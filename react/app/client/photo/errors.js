import EnumErrorCodes from './enums/EnumErrorCodes';

const errorMessages = {
    [EnumErrorCodes.NotLogin]: '账户未登录',

    DEFAULT: '未知错误'
};

export const getErrorMsg = e => errorMessages[e] || errorMessages.DEFAULT;
