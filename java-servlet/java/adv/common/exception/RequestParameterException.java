package adv.common.exception;

public class RequestParameterException extends BaseException {
    public RequestParameterException(Throwable e) { super(e); }

    public RequestParameterException(String message) { super(message); }
}
