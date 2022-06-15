$(document).ready(()=> {
    let selectAll = $("input#select_all").val()
    console.log(selectAll);

    $("input#select_all").change(function () {
        let value = $(this).is(':checked');
        console.log(value);
        if (value === true) {
            document.querySelectorAll(".group-input").forEach((elem, idx) => {
                $(elem).prop("checked", true);
            })
        } else {
            document.querySelectorAll(".group-input").forEach((elem, idx) => {
                $(elem).prop("checked", false);
            })
        }
    });

    $("input#one-file").change(function () {
        let oneFile = $(this).is(':checked');
        let manyFilesElem = $("input#many-file")
        let manyFiles = manyFilesElem.is(":checked")

        if (oneFile) {
            $(manyFilesElem).prop("checked", false)
        } else {
            $(manyFilesElem).prop("checked", true)
        }
    })

    $("input#many-file").change(function () {
        let manyFile = $(this).is(':checked');
        let oneFileElem = $("input#many-file")
        let oneFile = oneFileElem.is(":checked")

        if (manyFile) {
            $(oneFileElem).prop("checked", false)
        } else {
            $(oneFileElem).prop("checked", true)
        }
    })
})