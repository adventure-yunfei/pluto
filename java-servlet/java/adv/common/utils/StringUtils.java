package adv.common.utils;

import java.util.List;

public class StringUtils {
    public static boolean isEmpty(String str) {
        return str == null || str.isEmpty();
    }

    public static boolean isNotEmpty(String str) {
        return !isEmpty(str);
    }

    public static boolean contains(String[] strArr, String str) {
        for (String src: strArr) {
            if ((src == null && str == null) || (src != null && src.equals(str))) {
                return true;
            }
        }
        return false;
    }
}
