package adv.blog.pagectrl;

import adv.blog.EnumBlogCouchdb;
import adv.common.RequestContext;
import adv.common.couchdb.CouchdbException;
import adv.common.couchdb.CouchdbUtils;
import adv.common.exception.ControllerException;
import adv.common.pagectrl.IPageCtrl;
import adv.common.utils.StringUtils;

import java.io.IOException;
import java.net.URISyntaxException;

public class EditBlogPage implements IPageCtrl {
    @Override
    public void process(RequestContext context) throws ControllerException {
        String blogId = context.getParam("blogId");
        String blogDocJson = "null";
        if (StringUtils.isNotEmpty(blogId)) {
            String couchdbPath = String.format("/%s/%s", EnumBlogCouchdb.BLOG, blogId);
            try {
                blogDocJson = CouchdbUtils.getCouchdbData(couchdbPath).getResponse();
            } catch (IOException | URISyntaxException e) {
                throw new ControllerException(e);
            }
        }

        context.getRequest().setAttribute("blogData", blogDocJson);
    }
}
