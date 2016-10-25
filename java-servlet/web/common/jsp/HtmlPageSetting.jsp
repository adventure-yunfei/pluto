<%  if (request.getAttribute("_hasSetDocType") == null) { %>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<%      request.setAttribute("_hasSetDocType", Boolean.TRUE);
    } %>