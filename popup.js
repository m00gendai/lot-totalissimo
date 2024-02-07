const toggle = document.getElementById("toggle");
const toggleButton = document.getElementById("overlay");
const svg = document.getElementById("offButton");
const inputField = document.getElementById("prozent")
const confirmButton = document.getElementById("confirm")

// Returns current tab id
async function getCurrentTab() {
	let queryOptions = { active: true, currentWindow: true };
	let [tab] = await chrome.tabs.query(queryOptions);
	return tab.id;
} 

// Checks local storage and sets the popup element states accordingly
(async () => {
	
	// Gets and sets the toggle status
	const result = await chrome.storage.local.get(["status"])
	if(result.status === undefined || result.status[0] === "0"){
		toggle.value = 0
		svg.setAttribute("stroke", "red");
		toggleButton.style.boxShadow = "0px 0px 15px 2px red";
		confirmButton.disabled = true // If the toggle status is OFF, you can't interact with the confirmation button
	} else if(result.status[0] === "1"){
		toggle.value = 1
		svg.setAttribute("stroke", "green");
		toggleButton.style.boxShadow = "0px 0px 15px 5px lime";
		confirmButton.disabled = false // If the toggle status is ON, the confirmation button allows you to update the percentage value
	}
	
	// Gets and sets the percentage amount and sets it to a value if there exists one
	const value = await chrome.storage.local.get(["amount"])
	if(value.amount !== undefined){
		inputField.value = value.amount[0]
	}
})()

// Handles state change of the toggle element and inserts styles accordingly
document.getElementById("overlay").addEventListener("click", async function(){
	const tab = await getCurrentTab()
	if(toggle.value === "0"){
		toggle.value = "1"
		svg.setAttribute("stroke", "green");
		toggleButton.style.boxShadow = "0px 0px 15px 5px lime";
		confirmButton.disabled = false // If the toggle status is ON, the confirmation button allows you to update the percentage value
		const response = await chrome.tabs.sendMessage(tab, {toggle: "on"}).catch(() => {});
  	}
    else if(toggle.value === "1"){
		toggle.value = "0"
		svg.setAttribute("stroke", "red");
		toggleButton.style.boxShadow = "0px 0px 15px 2px red";
		confirmButton.disabled = true // If the toggle status is OFF, you can't interact with the confirmation button
		const response = await chrome.tabs.sendMessage(tab, {toggle: "off"}).catch(() => {});
    }
	chrome.storage.local.set({ "status": [toggle.value, tab] })
})

// Handles the input percentage value updating
confirmButton.addEventListener("click", async function(){
	const value = document.getElementById("prozent").value
	const tab = await getCurrentTab()
	chrome.storage.local.set({ "amount": [value, tab] })
	const response = await chrome.tabs.sendMessage(tab, {amount: value}).catch(() => {});
})