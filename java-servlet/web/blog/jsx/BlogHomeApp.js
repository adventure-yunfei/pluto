define(['jClass/jClass', 'react'], function (jClass, React) {
    return jClass.declare(
        null,
        null,
        {
            start: function (config) {
                var BlogPreview = React.createClass({
                    render: function () {
                        return <div className="blogPreview">
                            <div className="title">{this.props.blog.title}</div>
                            <div className="date">{this.props.blog.create_date}</div>
                            <div className="content" dangerouslySetInnerHTML={{__html: this.props.blog.content}}></div>
                        </div>;
                    }
                });

                var RootView = React.createClass({
                    render: function render() {
                        return <div className="blogsContainer">{this.renderBlogs()}</div>;
                    },
                    renderBlogs: function renderBlogs() {
                        return this.props.blogs.map(function (blog) {
                            return <BlogPreview blog={blog}/>;
                        });
                    }
                });

                React.render(<RootView blogs={config.blogs}/>, document.body);
            }
        }
    );
});