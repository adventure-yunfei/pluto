package adv.common.exception;

public class GeneralException extends BaseException {
    public GeneralException(Exception e) {
        super(e);
    }

    public GeneralException(String message) {
        super(message);
    }
}
