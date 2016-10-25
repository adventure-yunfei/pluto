package adv.common.couchdb;

import adv.common.utils.Util;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.util.List;
import java.util.Map;

public class CouchdbResponse {
    private HttpURLConnection _connection = null;

    public CouchdbResponse(HttpURLConnection conn) {
        _connection = conn;
    }

    public int getCode() throws IOException {
        return _connection.getResponseCode();
    }

    public String getHeader(String key) {
        return _connection.getHeaderField(key);
    }

    public Map<String, List<String>> getHeaders() {
        return _connection.getHeaderFields();
    }

    public String getResponse() throws IOException {
        return getResponse(false);
    }

    public String getResponse(boolean fallbackToError) throws IOException {
        try {
            return Util.inputStreamToString(_connection.getInputStream());
        } catch (IOException e) {
            if (fallbackToError) {
                return getErrorResponse();
            } else {
                throw e;
            }
        }
    }

    public String getErrorResponse() throws IOException {
        InputStream errorStream = _connection.getErrorStream();
        return errorStream == null ? null : Util.inputStreamToString(errorStream);
    }
}
