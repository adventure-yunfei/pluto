package adv.common;

import adv.common.exception.RequestParameterException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class RequestContext {
    private HttpServletRequest _request;
    private HttpServletResponse _response;
    
    public RequestContext(HttpServletRequest request, HttpServletResponse response) {
        _request = request;
        _response = response;
    }
    
    public HttpServletRequest getRequest() { return _request; }
    public HttpServletResponse getResponse() { return _response; }
    
    public String getParam(String paramName) {
        return _request.getParameter(paramName);
    }

    public String ensureParam(String paramName) throws RequestParameterException{
        String paramValue = getParam(paramName);
        if (paramValue == null) {
            throw new RequestParameterException("Parameter " + paramName + " does not exist in the request");
        } else {
            return paramValue;
        }
    }
}
