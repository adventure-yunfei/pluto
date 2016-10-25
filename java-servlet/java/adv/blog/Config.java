package adv.blog;

import adv.blog.pagectrl.BlogHomePage;
import adv.blog.pagectrl.EditBlogPage;
import adv.blog.pagectrl.OpenBlogPage;
import adv.common.IConfig;

public class Config extends adv.common.Config {
    private static Config _instance = new Config();
    
    Config() {
        addPageConfig("home", "/blog/jsp/home.jsp", BlogHomePage.class);
        addPageConfig("edit", "/blog/jsp/edit.jsp", EditBlogPage.class);
        addPageConfig("blog", "/blog/jsp/blog.jsp", OpenBlogPage.class);
    }
    
    public static IConfig getInstance() {
        return _instance;
    }
}
