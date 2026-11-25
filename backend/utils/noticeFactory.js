const NoticeFactory = {
    createNotice(data) {
        return {
            title: data.title.trim(),
            content: data.content.trim(),
            target_role: data.target_role || "all",
            publish_date: data.publish_date || null,
            created_by: data.created_by,
            status: data.status || "published"
        };
    },

    updateNotice(data) {
        return {
            title: data.title.trim(),
            content: data.content.trim(),
            target_role: data.target_role || "all",
            publish_date: data.publish_date || null,
            status: data.status || "published"
        };
    }
};

module.exports = NoticeFactory;