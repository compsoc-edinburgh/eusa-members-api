window.onload = () => {
    document.querySelectorAll('[data-selects]')
        .forEach(el => {
            el.addEventListener('click', () => {
                const target = document.querySelector(`#${el.dataset.selects}`)

                const range = document.createRange()
                range.selectNode(target)
                window.getSelection().removeAllRanges()
                window.getSelection().addRange(range)
            })
        })

    document.querySelectorAll('[data-copies]')
        .forEach(el => {
            el.addEventListener('click', () => {
                const target = document.querySelector(`#${el.dataset.copies}`)

                const range = document.createRange()
                range.selectNode(target)
                window.getSelection().removeAllRanges()
                window.getSelection().addRange(range)

                document.execCommand("copy");
            })
        })
}
