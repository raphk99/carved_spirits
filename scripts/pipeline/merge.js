const fs = require('fs');
const path = require('path');

const eventsPath = path.join(__dirname, '..', '..', 'public', 'assets', 'data', 'events.json');
const outputsPath = path.join(__dirname, 'outputs', 'events-output.json');

const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

for (const outputEvent of outputs) {
    const existingIndex = events.findIndex(e => e.id === outputEvent.id);
    if (existingIndex >= 0) {
        const existing = events[existingIndex];
        
        if (existing.coordinatesList && existing.coordinatesList.length > 0) {
            outputEvent.coordinatesList = existing.coordinatesList;
        }
        if (existing.image) {
            outputEvent.image = existing.image;
        }
        
        for (let i = 0; i < outputEvent.content.length; i++) {
            const existingContent = existing.content.find(c => c.subtitle === outputEvent.content[i].subtitle);
            if (existingContent && existingContent.image) {
                outputEvent.content[i].image = existingContent.image;
            } else if (i < existing.content.length && existing.content[i].image) {
                outputEvent.content[i].image = existing.content[i].image;
            }
        }
        
        if (existing.subtitle && !outputEvent.subtitle) {
            outputEvent.subtitle = existing.subtitle;
        }
        
        events[existingIndex] = outputEvent;
    } else {
        events.push(outputEvent);
    }
}

fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2));
console.log(`Merged ${outputs.length} output events into ${eventsPath}`);
