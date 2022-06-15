function displayPlanInfo(currUser) {
    let name = `${currUser['plan']['name']}`;
    let total_messages = `${currUser['plan']['total_messages']}`;
    let messages_sent = `${currUser['plan']['messages_sent']}`;
    let messagesLeft = parseInt(total_messages) - parseInt(messages_sent)

    $("#plan-left").text(messagesLeft);
    $("#plan-name").text(name);
    $("#plan-sent").text(messages_sent);
}

function limitSendButton(currUser) {
    const Swal = nodeRequire("sweetalert2");
    let name = `${currUser['plan']['name']}`;
    let total_messages = `${currUser['plan']['total_messages']}`;
    let messages_sent = `${currUser['plan']['messages_sent']}`;
    let messagesLeft = parseInt(total_messages) - parseInt(messages_sent)
    let filteredMaxTabs;
    let data = {};

    // rule to block user from sending messages
    if(messagesLeft <= 0) {
        Swal.fire({
            title: "Quantidade de Mensagens esgotadas!",
            html: "Renove seu plano ou faça o upgrade.",
            icon: "error"
        });

        // block send button
        $("button[data-action='send_message']").each((index, elem) => {
            $(elem).attr("disabled", true);
        });

        // block group extraction
        $("button#start-extraction").attr("disabled", true)
    }

    if (name === "Free" || name === 'Bronze') {
        $("button#add_section").hide();
        $("button#add_section").attr("disabled", true);
        filteredMaxTabs = 1;
    }

    if (name === "Prata") {
        let allTabs = $(".section-tab-item");
        filteredMaxTabs = 3;
    }

    data['filteredMaxTabs'] = filteredMaxTabs;
    return data;
}
