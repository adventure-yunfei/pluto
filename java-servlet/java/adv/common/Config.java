package adv.common;

import java.lang.reflect.InvocationTargetException;
import java.util.HashMap;
import java.util.Map;

import adv.common.exception.ConfigNotFound;
import adv.common.exception.GeneralException;
import adv.common.pagectrl.DefaultPageCtrl;
import adv.common.pagectrl.IPageCtrl;
import adv.common.taskctrl.ITaskCtrl;

public abstract class Config implements IConfig {
    private Map<String, String> pageJSPs = new HashMap<String, String>();
    private Map<String, Class<? extends IPageCtrl>> pageControls = new HashMap<>();
    private Map<String, Class<? extends ITaskCtrl>> taskControls = new HashMap<String, Class<? extends ITaskCtrl>>();
    
    public static IConfig getConfig(String projectName) throws ConfigNotFound {
            try {
                Class<?> cls = Class.forName("adv." + projectName + ".Config");
                return (IConfig) cls.getMethod("getInstance", new Class[0]).invoke(cls, new Object[0]);
            } catch (IllegalAccessException | IllegalArgumentException
                    | InvocationTargetException | NoSuchMethodException
                    | SecurityException | ClassNotFoundException e) {
                throw new ConfigNotFound(e);
            }
    }
    
    protected void addPageConfig(String pageName, String pageJSP) {
        assert ! pageJSPs.containsKey(pageName);
        
        pageJSPs.put(pageName, pageJSP);
    }
    
    protected void addPageConfig(String pageName, String pageJSP, Class<? extends IPageCtrl> pageClass) {
        assert ! pageJSPs.containsKey(pageName);
        assert ! pageControls.containsKey(pageName);
        
        pageJSPs.put(pageName, pageJSP);
        pageControls.put(pageName, pageClass);
    }
    
    protected void addTaskConfig(String taskId, Class<? extends ITaskCtrl> taskClass) {
        assert ! taskControls.containsKey(taskId);
        
        taskControls.put(taskId, taskClass);
    }

    @Override
    public String getPageJSP(String targetPage) {
        return pageJSPs.get(targetPage);
    }

    @Override
    public IPageCtrl getPageController(String targetPage) throws GeneralException {
        try {
            return pageControls.getOrDefault(targetPage, DefaultPageCtrl.class).newInstance();
        } catch (InstantiationException | IllegalAccessException e) {
            throw new GeneralException(e);
        }
    }

    @Override
    public ITaskCtrl getTaskInstance(String taskId) throws GeneralException {
        try {
            return taskControls.get(taskId).newInstance();
        } catch (NullPointerException/**Explicit for Map NULL value*/ | InstantiationException | IllegalAccessException e) {
            throw new GeneralException(e);
        }
    }
}
