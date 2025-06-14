function validateORDCode() {
    clearlog();
    const allowed = ["A","B","C","AB","AC","BA","BC","CA","CB",
        "XU","XD","YU","YD","ZU","ZD","REN",
        "A-B","A-C","B-A","B-C","C-A","C-B"];

    const raw = document.getElementById('ordinput')
                    .value.trim()
                    .toUpperCase()
                    .split(/\s+/);

    const tokens = raw.flatMap(w => {
        const m = w.match(/^(X[UD]|Y[UD]|Z[UD])X(\d+)$/);
        return m
        ? Array.from({length: +m[2]}, () => m[1])
        : [w];
    });
    

    if (!tokens.includes("REN")) {
        pusherror("Missing required function 'REN' in input.", "A missing 'REN' suffix will prevent this input from being processed properly in view.");
    } else {

        const renIndex = tokens.lastIndexOf("REN");
        if (renIndex < tokens.length - 1) {
            pusherror("Unexpected function after 'REN'.", "There should be no function after 'REN'. Move 'REN' to the end.");
        }
    }

    const invalid = tokens.filter(w => !allowed.includes(w));
    if (invalid.length) {
        pusherror("Invalid ORD Function or empty input found: " + invalid.join(", "), "Did you type the code correctly?");
    }

    validateAandC(tokens);

    // 4. Check for CA usage
    const caCount = tokens.filter(w => w === "CA").length;
    if (caCount > 0) {
        pushwarning("CA used. Do you have a valid target?", "Attempting to issue the CA (POSESS) function without a valid nearby entity may result in invalid input.")
    }

    // 5. Check for BC usage
    const bcCount = tokens.filter(w => w === "BC").length;
    if (bcCount > 0) {
        pushwarning("BC used. Are you on info_player_start?", "Attempting to trigger a ragdoll state while in info_player_start can cause an invalid input.");
    }

    const bchyphenCount = tokens.filter(w => w === "B-C").length;
    if (bchyphenCount > 0) {
        pushwarning("B-C used. Are you on info_player_start?", "Attempting to trigger a ragdoll state while in info_player_start can cause an invalid input.");
    }

    // 7. Check for unintentional chaining: example CA-B-C includes CB
    for (let i = 0; i < tokens.length - 1; i++) {
        const combo = tokens[i] + "-" + tokens[i+1];
        if (combo === "AC-BC") {
            pushwarning("AC-BC may unintentionally trigger CB (AXIS)", "Sequential input of A-C followed by B-C may produce an unintended C-B action in between.");
        }
    }
    
    for (let i = 0; i < tokens.length - 1; i++) {
        const combo = tokens[i] + "-" + tokens[i+1];
        if (combo === "CA-BC") {
            pushwarning("CA-BC may unintentionally trigger A-B (USE)", "Sequential input of C-A followed by B-C may produce an unintended A-B action in between.");
        }
    }

    for (let i = 0; i < tokens.length - 1; i++) {
        const combo = tokens[i] + "-" + tokens[i+1];
        if (combo === "CB-AB") {
            pushwarning("CB-AB may unintentionally trigger B-A (NOCLIP)", "Sequential input of C-B followed by A-B may produce an unintended B-A action in between.");
        }
    }
}

function pusherror(error, why) {
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = error;
  
  const paragraph = document.createElement("p");
  paragraph.textContent = why;

  details.appendChild(summary);
  details.appendChild(paragraph);
  details.classList.add('errormessage')

  document.getElementById("log").appendChild(details);
}

function pushwarning(warn, why) {
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = warn;
  
  const paragraph = document.createElement("p");
  paragraph.textContent = why;

  details.appendChild(summary);
  details.appendChild(paragraph);
  details.classList.add('warningmessage')

  document.getElementById("log").appendChild(details);
}

function clearlog() {
    const myDiv = document.getElementById("log");
    myDiv.innerHTML = "";
}

function validateAandC(tokens) {
    let aStack = [];

    tokens.forEach((token, idx) => {
        if (token === "A") {
            aStack.push(idx); // track position of each A
        }
        if (token === "C" && aStack.length > 0) {
            aStack.pop(); // cancel the most recent A
        }
    });

    // Only show error if more than 1 unmatched 'A' remains
    if (aStack.length > 1) {
        pusherror(
            aStack.length + " A Function used – Hint Node already active!",
            "Placing a Hint Node while another is already active will result in invalid input."
        );
    } 
}

