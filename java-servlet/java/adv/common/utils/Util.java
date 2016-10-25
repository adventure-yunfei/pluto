package adv.common.utils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

public class Util {
    public static String inputStreamToString(InputStream in) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        int nRead;
        byte[] byteBuffer = new byte[16384];
        while ((nRead = in.read(byteBuffer, 0, byteBuffer.length)) != -1) {
            buffer.write(byteBuffer, 0, nRead);
        }
        buffer.flush();

        return  buffer.toString();
    }
}
