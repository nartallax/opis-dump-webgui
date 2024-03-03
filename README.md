# Opis dump webgui
This web GUI is meant to show Minecraft chunk loading stats.

# How to get the data

First thing first, you need some data to show.  
Recommended way to get this data is to patch Opis mod. That way the mod will generate dumps in regular intervals that can be later loaded in this GUI. See `OpisServerTickHandler.java` - there are comments like `// <custom update: stat dumping>` - those are parts you should patch in.  
Alternatively, you can get data from anywhere you like. It's plaintext; first line is timestamp in msec of the dump, second line is dumped chunks count, the rest of the lines are chunk descriptions: `x`, `z`, `dim`, `load`; tab separated. `x` and `z` are chunk coords not block coords (i.e. must be multiplied by 16 to get block coords); `load` is nanoseconds.  

Then you have to figure out how to deliver this data to UI. Most obvious solution will be to use some sort of webserver.  

# Build

Building the UI is the easiest part.

1. Clone this repo
2. `npm install`
3. `npm run release`

This will create `target` directory with all the UI files there. Those files you can deploy whenever you like, presumably by the same webserver that delivers the data.
