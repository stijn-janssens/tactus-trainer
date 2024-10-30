import { OpenSheetMusicDisplay, Cursor, VoiceEntry, Note, StemDirectionType } from "opensheetmusicdisplay";


async function getXML(url: string) {
	return new Promise(function (resolve, reject) {
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function () {
		switch (xhttp.readyState) {
			case 0 : // UNINITIALIZED
			case 1 : // LOADING
			case 2 : // LOADED
			case 3 : // INTERACTIVE
			break;
			case 4 : // COMPLETED
				resolve(xhttp.responseXML)
				break;
			default:
				reject("Error loading MusicXML file.");	
				throw("Error loading MusicXML file.");
		}
		}
	xhttp.open("GET", url, true);
	xhttp.send();
	});
}


let osmd: OpenSheetMusicDisplay;

let container: HTMLElement = <HTMLElement>document.createElement("div");

let element: HTMLElement = <HTMLElement>document.createElement("button");
element.onclick = generateMeasures

element.appendChild(document.createTextNode("Generate new measures!"));
document.body.appendChild(element);

document.body.appendChild(container);

osmd = new OpenSheetMusicDisplay(container, {autoResize: false});
osmd.setLogLevel('info');

function afterRender() {
	osmd.setOptions( { autoResize: true });
}

async function generateMeasures() {
	const NUMBER_OF_MEASURES = 8
	const DYNAMIC_TEMP = 0.35
	const ARTICULATION_TEMP = 0.35

	let array = ["Andante", "Maestoso", "Lento", "Allegro"]
	const randomTempo = array[Math.floor(Math.random() * array.length)];
	let tempo: XMLDocument = <XMLDocument>await getXML("resources/tempo.xml");
	let ending: XMLDocument = <XMLDocument>await getXML("resources/ending.xml");
	let boilerPlate: XMLDocument = <XMLDocument>await getXML("resources/boiler_plate.xml");
	
	for (let i = 0; i < NUMBER_OF_MEASURES; i++) {
		boilerPlate.querySelector('part').appendChild(document.createElement("measure_" + i))
	}
	for (let i = 0; i < NUMBER_OF_MEASURES; i++) {
		let dynamic: XMLDocument = <XMLDocument>await getXML("resources/dynamics/dynamic.xml");
		const changeDynamic = Math.random() <= DYNAMIC_TEMP;
		const changeArticulation = Math.random() <= ARTICULATION_TEMP;


		let measuresArray = ["all_quarter_notes.xml", "all_eighth_notes.xml", "whole_note.xml", "all_half_notes.xml",
			"syncopated_notes.xml", "quarter_and_half_notes.xml", "half_note_triplet.xml", "quarter_note_triplets.xml",
			"eighth_note_triplets.xml", "eighth_note_triplets_tied.xml", "syncopated_notes_tied.xml",
			"dotted_quarter_notes.xml", "dotted_quarter_notes_reverse.xml", "all_eighth_notes_rest.xml", "all_sixteenth_notes.xml"]
		const randomMeasure = measuresArray[Math.floor(Math.random() * measuresArray.length)];
		let dynamicArray = ["p", "mf", "mp", "f", "pp", "ff", "crescendo", "diminuendo", "fp", "sfz"];
		const randomDynamic = dynamicArray[Math.floor(Math.random() * dynamicArray.length)];

		let articulationArray = ['accent', 'strong-accent', 'staccato', 'tenuto', 'detached-legato', 'staccatissimo', 'spiccato']
		const randomArticulation = articulationArray[Math.floor(Math.random() * articulationArray.length)];	
		let measure: XMLDocument = <XMLDocument>await getXML("resources/" + randomMeasure);
		let measurePart = measure.querySelector('measure');
		// Add tempo indication to first measure

		if (changeArticulation) {
			// Entire measure gets the same random articulation
				let elem = document.createElement("notations")
				let art = document.createElement("articulations")
				art.appendChild(document.createElement(randomArticulation))
				elem.appendChild(art)
				let notes = measurePart.getElementsByTagName("note");

				for (let note of notes) {
					note.appendChild(elem.cloneNode(true)); // Use cloneNode(true) to create a copy of `elem`
				}
		}


		if (i === 0) {
			let clef: XMLDocument = <XMLDocument>await getXML("resources/clef.xml");
			while (clef.querySelector('measure').firstChild) {
				measurePart.insertBefore(clef.querySelector('measure').firstChild, measurePart.querySelector('note'));
			}
			tempo.querySelector('measure>direction>direction-type>words').textContent = randomTempo;
			while (tempo.querySelector('measure').firstChild) {
				measurePart.insertBefore(tempo.querySelector('measure').firstChild, measurePart.querySelector('note'));
			}
		}
		if (i === NUMBER_OF_MEASURES - 1) {
			measurePart.appendChild(ending.querySelector('measure>barline'));
		}

		if (changeDynamic) {
			let dynamicPart = dynamic.querySelector('measure>direction>direction-type>dynamics');
			if (randomDynamic === "diminuendo" || randomDynamic === "crescendo") {
				dynamicPart = dynamic.querySelector('measure>direction>direction-type');
				dynamicPart.removeChild(dynamicPart.querySelector('dynamics'))
				let elem = document.createElement("wedge")
				elem.setAttribute("type", randomDynamic)
				dynamicPart.appendChild(elem)
			} else {
				dynamicPart.appendChild(document.createElement(randomDynamic));
			}
			
			measurePart.insertBefore(dynamic.querySelector('measure>direction').cloneNode(true), measurePart.querySelector('note'));
			if (randomDynamic === "diminuendo" || randomDynamic === "crescendo") {
				let wedge: XMLDocument = <XMLDocument>await getXML("resources/dynamics/stop_wedge.xml");
				measurePart.appendChild(wedge.querySelector('measure>direction'));
			}
			console.log(measurePart)
		}
		
		let boilerPlatePart = boilerPlate.querySelector('score-partwise>part');
		boilerPlatePart.replaceChild(measurePart.cloneNode(true), boilerPlatePart.querySelector('measure_' + (i).toString()));
	}
	loadMusicXML(boilerPlate)
}

/**
 * Load a MusicXml file via xhttp request, and display its contents.
 */
function loadMusicXML(xml: XMLDocument) {
	osmd
		.load(xml)
		.then(
			() => {
				osmd.render();
				afterRender();
			},
			(err) => console.log(err)
		);
 }
