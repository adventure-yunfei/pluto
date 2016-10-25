package adv.common.servlet;

import adv.common.EnumHttpMethods;
import adv.common.couchdb.CouchdbResponse;
import adv.common.couchdb.CouchdbUtils;
import adv.common.utils.StringUtils;
import org.json.JSONObject;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class CouchdbForwarderServlet extends BaseServlet {
    private static final String PARAM_COUCHDB_PATH = "cdb_path";
    private static final String PARAM_COUCHDB_QUERY = "cdb_query";
    private static final String PARAM_REQUEST_METHOD = "cdb_method";
    private static final String PARAM_POST_PUT_DATA = "cdb_data";
    private static final String PARAM_COUCHDB_HEADERS = "cdb_headers";

    private static final String[] RESPONSE_EXCLUDE_HEADERS = { null, "Content-Length", "Date", "Server", "Set-Cookie", "Transfer-Encoding" };

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doPost(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            Map<String, String> headers = new HashMap<>();
            JSONObject cdbheaders = new JSONObject(getParam(req, PARAM_COUCHDB_HEADERS, "{}"));
            cdbheaders.keySet().stream().forEach(cdbHeaderKey -> headers.put(cdbHeaderKey, cdbheaders.getString(cdbHeaderKey)));

            CouchdbResponse cdbResp = CouchdbUtils.getCouchdbData(
                    getParam(req, PARAM_COUCHDB_PATH),
                    getParam(req, PARAM_COUCHDB_QUERY, null),
                    getParam(req, PARAM_REQUEST_METHOD, EnumHttpMethods.GET),
                    getParam(req, PARAM_POST_PUT_DATA, null),
                    headers);

            resp.setStatus(cdbResp.getCode());

            // Pass response headers from couchdb REST
            cdbResp.getHeaders().keySet().stream()
                    .filter(respHeaderKey -> !StringUtils.contains(RESPONSE_EXCLUDE_HEADERS, respHeaderKey))
                    .forEach(respHeaderKey -> resp.setHeader(respHeaderKey, cdbResp.getHeader(respHeaderKey)));
//            for (String key : cdbResp.getHeaders().keySet()) {
//                if (!StringUtils.contains(RESPONSE_EXCLUDE_HEADERS, key)) {
//                    resp.setHeader(key, cdbResp.getHeader(key));
//                }
//            }

            resp.getOutputStream().write(cdbResp.getResponse(true).getBytes());
        } catch (URISyntaxException e) {
            throw new ServletException("URI cannot be built correctly", e);
        }
    }
}
