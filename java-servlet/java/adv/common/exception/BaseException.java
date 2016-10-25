package adv.common.exception;

public class BaseException extends Exception {
    public BaseException() { super(); }
    public BaseException(Throwable e) { super(e); }

    public BaseException(String message) { super(message); }

    public BaseException(String message, Throwable e) { super(message, e);}
}
