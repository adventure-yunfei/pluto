package adv.blog.pagectrl;

import adv.common.RequestContext;
import adv.common.couchdb.CouchdbException;
import adv.common.couchdb.CouchdbUtils;
import adv.common.exception.ControllerException;
import adv.common.pagectrl.IPageCtrl;
import org.json.JSONArray;
import org.json.JSONObject;

import java.io.IOException;
import java.net.URISyntaxException;

public class BlogHomePage implements IPageCtrl {
    @Override
    public void process(RequestContext context) throws ControllerException {
        try {
            JSONArray blogs = new JSONArray();
            JSONArray blogDetails = (new JSONObject(CouchdbUtils.getCouchdbData("/blog/_design/main/_view/by_create_date").getResponse())).getJSONArray("rows");
            int length = blogDetails.length();
            for (int i = 0; i < length; i++) {
                blogs.put(blogDetails.getJSONObject(i).getJSONObject("value"));
            }
            context.getRequest().setAttribute("blogs", blogs.toString());
        } catch (IOException | URISyntaxException e) {
            throw new ControllerException(e);
        }
    }
}
