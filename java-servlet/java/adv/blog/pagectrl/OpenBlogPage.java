package adv.blog.pagectrl;

import adv.blog.EnumBlogCouchdb;
import adv.common.RequestContext;
import adv.common.couchdb.CouchdbException;
import adv.common.couchdb.CouchdbResponse;
import adv.common.couchdb.CouchdbUtils;
import adv.common.exception.ControllerException;
import adv.common.exception.RequestParameterException;
import adv.common.pagectrl.IPageCtrl;
import org.json.JSONObject;

import java.io.IOException;
import java.net.URISyntaxException;

public class OpenBlogPage implements IPageCtrl {
    @Override
    public void process(RequestContext context) throws ControllerException {
        try {
            CouchdbResponse cdbResp = CouchdbUtils.getCouchdbData("/" + EnumBlogCouchdb.BLOG + "/" + context.ensureParam("blogId"));
            JSONObject blogDoc = new JSONObject(cdbResp.getResponse());

            String[] filterProps = { "title", "content" };
            context.getRequest().setAttribute("blogData", (new JSONObject(blogDoc, filterProps)).toString());
        } catch (RequestParameterException | IOException | URISyntaxException e) {
            throw new ControllerException(e);
        }
    }
}
