package adv.common.couchdb;

import adv.common.EnumHttpMethods;
import adv.common.exception.GeneralException;
import adv.common.utils.StringUtils;
import adv.common.utils.Util;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Map;

public class CouchdbUtils {
    private static final String COUCHDB_PROTOCOL = "http";
    private static final String COUCHDB_HOST = "127.0.0.1";
    private static final int COUCHDB_PORT = 5984;

    public static CouchdbResponse getCouchdbData(String path) throws IOException, URISyntaxException {
        return getCouchdbData(path, null, EnumHttpMethods.GET, null, null);
    }

    public static CouchdbResponse getCouchdbData(String path, String query) throws IOException, URISyntaxException {
        return getCouchdbData(path, query, EnumHttpMethods.GET, null, null);
    }

    public static CouchdbResponse getCouchdbData(String path, String query, String method, String data, Map<String, String> headers) throws IOException, URISyntaxException {
        URI couchdbURI = new URI(COUCHDB_PROTOCOL, null, COUCHDB_HOST, COUCHDB_PORT, path, query, null);

        HttpURLConnection conn = (HttpURLConnection) couchdbURI.toURL().openConnection();
        conn.setRequestMethod(method);

        // Set request header
        if (headers != null) {
            for (String key : headers.keySet()) {
                conn.setRequestProperty(key, headers.get(key));
            }
        }

        // Set post data for specified request method
        if ((method.equalsIgnoreCase("POST") || method.equalsIgnoreCase("PUT")) && StringUtils.isNotEmpty(data)) {
            conn.setDoOutput(true);
            DataOutputStream sendStream = new DataOutputStream(conn.getOutputStream());
            sendStream.writeBytes(data);
            sendStream.close();
        }

        conn.connect();

        return new CouchdbResponse(conn);
    }
}
