const darkModeSwitch = document.getElementById('theme-switch-input')
const saveButton = document.getElementById('save')
const clearButton = document.getElementById('clear')
const openButton = document.getElementById('open')

const message = document.getElementById('message')
const gridList = document.getElementById('grid-list')

const NO_SAVED_TABS_MSG = 'No tabs currently saved (▰˘︹˘▰)';


const MSG_TIME_OUT_DURATION = 900;
const print = (text, stayOnScreen, setNoTabs) => {
    message.innerText = text;
    message.style.display = 'block';
    if (!stayOnScreen) {
        setTimeout(() => {
            message.innerText = setNoTabs ? NO_SAVED_TABS_MSG : '';
            message.style.display = setNoTabs ? 'block' : 'none';
        }, MSG_TIME_OUT_DURATION);
    }
}

const deleteTab = (url) => {
    const selected = document.getElementById(url);
    selected.previousElementSibling.remove();
    selected.remove();
    let numOfTabs;
    browser.storage.local.get('savedTabs')
        .then(({savedTabs}) => {
            numOfTabs = savedTabs.length;
            if (numOfTabs === 1) {
                clearButton.click();
            } else {
                browser.storage.local.set({
                    savedTabs: savedTabs.filter((tab) => tab.url !== url)
                })
                    .then(() => {
                        setTimeout(() => {
                            document.querySelectorAll('#grid-list .index')
                                .forEach((element, i) => {
                                    element.innerHTML = `${i + 1}.`;
                                })
                        }, 150);
                    });
                print(url + " Deleted!")
            }
        });
}

// here we are creating the html elements which composes the tabs list
const displayTabsList = () => {
    browser.storage.local.get('savedTabs')
        .then(({savedTabs}) => {
            gridList.innerHTML = ''
            const tabsElementsList = []

            if (savedTabs) {
                savedTabs.forEach(({title, url}, i) => {
                    const tabLink = document.createElement('a')
                    tabLink.id = url
                    tabLink.href = url
                    tabLink.title = url

                    const index = document.createElement('span')
                    index.innerHTML = `${i + 1}.`
                    index.className = 'index'

                    tabLink.append(index)
                    tabLink.append(document.createTextNode(title))

                    const deleteButton = document.createElement('button')
                    deleteButton.onclick = () => deleteTab(url)
                    deleteButton.innerText = '✘'

                    tabsElementsList.push(deleteButton, tabLink)
                })

                gridList.append(...tabsElementsList)
            } else {
                print(NO_SAVED_TABS_MSG, true)
            }
        })
}

saveButton.onclick = () => {
    let numOfNewTabs = 0
    let numOfTabs = 0;
    browser.storage.local.get('savedTabs')
        .then(({savedTabs}) => {
            browser.tabs.query({})
                .then((tabs) => {
                    const newTabs = tabs
                        .filter(({url}) => url.slice(0, 5) !== 'about')
                        .map(({title, url}) => ({title, url}));
                    numOfNewTabs = newTabs ? newTabs.length : 0;
                    numOfTabs = savedTabs ? savedTabs.length : 0;

                    if (Array.isArray(savedTabs)) {
                        const combined = savedTabs;
                        newTabs.forEach((newTab) => {
                            if (!savedTabs.some(({url}) => url === newTab.url)) {
                                combined.push(newTab);
                            }
                        })
                        return browser.storage.local.set({
                            savedTabs: combined,
                        });
                    }
                    return browser.storage.local.set({
                        savedTabs: newTabs,
                    });
                })
                .then(() => {
                    if ((numOfNewTabs + numOfTabs) === 0) {
                        print('No valid new tabs to add', false, true);
                    } else {
                        if (numOfNewTabs === 0) {
                            print('No valid new tabs to add');
                        } else {
                            print('Saved!');
                            displayTabsList();
                        }
                    }
                })
                .catch(err => {
                    console.log({err});
                    print('Error!');
                });
        });
}

// clears the tabs list
clearButton.onclick = () => {
    browser.storage.local.remove('savedTabs')
        .then(() => {
            gridList.innerHTML = '';
            print('Tabs Cleared!', false, true);
        })
}

openButton.onclick = () => {
    async function openNewTab(tmp) {
        return await browser.tabs.create({
            url: tmp
        });
    }

    browser.storage.local.get('savedTabs')
        .then(({savedTabs}) => {
            if (!savedTabs || savedTabs.length === 0) {
                print('You do not have any saved Tabs', false, true);
            } else {
                savedTabs.forEach(({title, url}) => {
                    openNewTab(url);
                });
            }
        });
}

darkModeSwitch.onchange = (e) => {
    const isDarkMode = e.target.checked;
    browser.storage.local.set({darkMode: isDarkMode})
        .then(() => {
            if (isDarkMode) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        });
}

// here we render the tabs list (checks if we are on dark mode or not)
browser.storage.local.get('darkMode')
    .then(({darkMode}) => {
        if (darkMode) {
            darkModeSwitch.checked = true
            document.body.classList.add('dark')
        }
    })
    .finally(() => displayTabsList());
