function sendCookie(fromId, toId) {
    console.log("SEND cookies from " + fromId + " to " + toId);
    $.ajax({
        url: "/cookies",
        data: {
            from: fromId, to: toId
        },
        type: "POST",
        success: function(res) {
            console.log(res);
        }
    });
}
