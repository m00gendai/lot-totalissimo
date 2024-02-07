const table = document.getElementsByClassName("bidding-area") // the target table (there is only one)
const tableBody = table[0].children[0] // the target body table (there is only one child node)

const config = { attributes: true, childList: true, characterData: true, subtree: true }; // Mutation Observer configs

// Handles the injection of an additional row in the target table to display additional values
function injectAufpreisData(percent){
	
	// Initiates the percentage Float
	const percentage = percent/100
	
	// Removes an additional row if there already is one present
	if(document.getElementById("injectedAufpreis")){
		tableBody.removeChild(document.getElementById("injectedAufpreis"))
	}
	
	// Gets the currenty used (they all use the same currency)
	const currency = document.getElementsByClassName("auction-currency")

	// Creates the additional row
	const aufpreisRow = document.createElement("tr")
	aufpreisRow.id="injectedAufpreis"
	aufpreisRow.style.textTransform = "uppercase"
	aufpreisRow.style.fontSize = "1.25rem"
	
	// Creates the text field for the additional row
	const txt = document.createElement("td")
	txt.innerText = `Nach Aufpreis (${parseInt(percent)}%):`
	
	// Creates the value field for the additional row
	const aufpreis = document.createElement("td")
	
	/* 
		The asking price innerText is a number with a comma (,) as a thousand separator. 
		So, the split(",").join("") removes the comma and creates a parseable number to be parsed as an integer. 
		This parsed integer is then multiplied by the added percentage of the input field.
		Sicne it is currency, it is limited to two decimal points.
	*/
	aufpreis.innerText = `${currency[0].innerText}${(parseInt(document.getElementById("asking-price").innerText.split(",").join(""))*(1+percentage)).toFixed(2)}`
	
	aufpreisRow.appendChild(txt)
	aufpreisRow.appendChild(aufpreis)
	tableBody.appendChild(aufpreisRow)
}
	
// Initiates the Mutation Observer		
const observer = new MutationObserver(async (mutationsList) => {
	for(const mutation of mutationsList) {
		if(mutation.target.id === "asking-price"){
			
			// Initiates percent to 0
			let percent = 0
			
			// Gets percentage amount from local storage
			const value = await chrome.storage.local.get(["amount"])
			
			// If there is a percentage amount and it is not "", set percent to the percentage amount (otherwise it simply remains 0)
			if(value.amount !== undefined && value.amount.length !== 0){
				percent = value.amount[0]
			}
			
			// Call the injection function if a mutation has been observed
			injectAufpreisData(percent)
		}
	}
});

// Init function
(async () => {
	
	// Initiates percent to 0
	let percent = 0
			
	// Gets percentage amount from local storage
	const value = await chrome.storage.local.get(["amount"])

	// If there is a percentage amount and it is not "", set percent to the percentage amount (otherwise it simply remains 0)
	if(value.amount !== undefined && value.amount.length !== 0){
		percent = value.amount[0]
	}
	
	// Checks the toggle state and either starts or ends the Mutation Observer
	const result = await chrome.storage.local.get(["status"])
	if(result.status === undefined || result.status[0] === "0"){
		observer.disconnect()
		return
	}
	if(result.status[0] === "1"){
		
		// If its ON, it also calls the injection function
		injectAufpreisData(percent)
		observer.observe(document.getElementById("asking-price"), config);
	}
})()

// Listens for messages from the toggle state and Percentage Input Field Amends
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
	
	// Initiates percent to 0
	let percent = 0
	
	// If the message sends a percentage amount and it is not "", set percent to the percentage amount and call the injection function
	if(request.amount && request.amount[0].length !== 0){
		percent = request.amount
		injectAufpreisData(percent)
	}
	
	// If the message sends a percentage amount and it is "", call the injection function with the initialized percentage value
	if(request.amount && request.amount[0].length === 0){
		injectAufpreisData(percent)
	}
	
	// If the message carries no percentage amount
	if(!request.amount){
		
		// Gets percentage amount from local storage
		const value = await chrome.storage.local.get(["amount"])
		
		// If there is a percentage amount and it is not "", set percent to the percentage amount (otherwise it simply remains 0)
		if(value.amount !== undefined && value.amount[0] !== ""){
			percent = value.amount[0]
		}
		
		//If the message carries a toggle state and it is ON, call the injection function and start the Mutation Observer
		if(request.toggle === "on"){
			injectAufpreisData(percent)
			observer.observe(document.getElementById("asking-price"), config);
		} 
		
		//If the message carries a toggle state and it is OFF, disconnet the Mutation Observer and remove the additional injected row if it exists
		if(request.toggle === "off"){
			observer.disconnect()
			if(document.getElementById("injectedAufpreis")){
				tableBody.removeChild(document.getElementById("injectedAufpreis"))
			}
		}
	}
})