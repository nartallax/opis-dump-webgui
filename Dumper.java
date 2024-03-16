package mcp.mobius.opis.events;

import cpw.mods.fml.relauncher.Side;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.Date;
import mcp.mobius.mobiuscore.profiler.ProfilerSection;
import mcp.mobius.opis.data.holders.basetypes.SerialInt;
import mcp.mobius.opis.data.holders.stats.StatsChunk;
import mcp.mobius.opis.data.managers.ChunkManager;
import mcp.mobius.opis.data.managers.MetaManager;
import mcp.mobius.opis.modOpis;
import mcp.mobius.opis.network.PacketManager;
import mcp.mobius.opis.network.enums.Message;
import mcp.mobius.opis.network.packets.server.NetDataValue;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/** Patched-in class that makes perf dumps */
public class Dumper {

    private static int DEFAULT_DUMP_INTERVAL_MINUTES = 2 * 60;
    private static int DEFAULT_DUMP_LINES = 500;
    private static boolean DEFAULT_RUN_ON_START = false;
    private static String DUMP_PATH = "./chunk_stats_dump.tsv";
    private static String CONFIG_PATH = "./opis_dump_config.cfg";
    private static Logger log = LogManager.getLogger("OpisDumper");

    private int minutesPassed = 0;
    private int dumpIntervalMinutes = DEFAULT_DUMP_INTERVAL_MINUTES;
    private int dumpLines = DEFAULT_DUMP_LINES;
    private boolean runOnStart = DEFAULT_RUN_ON_START;
    private boolean didReadConfig = false;

    public void onMinutePassed() {
        if (!didReadConfig) {
            log.info("Opis Dumper is initializing!");
            readConfig();
            if (runOnStart) {
                this.initiateDump();
            }
        }

        minutesPassed++;
        if (minutesPassed >= dumpIntervalMinutes) {
            minutesPassed = 0;
            this.initiateDump();
        }
    }

    private void initiateDump() {
        if (!modOpis.profilerRun) {
			log.info("Opis Dumper is initializing dumping process.");
            MetaManager.reset();
            modOpis.profilerRun = true;
            ProfilerSection.activateAll(Side.SERVER);
            PacketManager.sendPacketToAllSwing(
                    new NetDataValue(Message.STATUS_START, new SerialInt(modOpis.profilerMaxTicks)));
        }
    }

    public void dump() {
        this.readConfig();
		log.info("Opis Dumper is grabbing the dump data.");
        File f = new File(DUMP_PATH);
        FileOutputStream s = null;
        try {
            s = new FileOutputStream(f);
            dumpInto(s);
        } catch (Exception e) {
            log.error("Sowwy UwU failed to take Opis dump: " + e.getMessage());
        } finally {
            try {
                if (s != null) {
                    s.flush();
                    s.close();
                }
            } catch (Exception e) {
                /* whaaatever. */
            }
        }
    }

    private void dumpInto(FileOutputStream o) throws java.io.IOException {
        String result = "";

        result += new Date().getTime() + "\n";

        ArrayList<StatsChunk> timingChunks = ChunkManager.INSTANCE.getTopChunks(dumpLines);
        result += timingChunks.size() + "\n";

        for (StatsChunk c : timingChunks) {
            result += c.getChunk().chunkX + "\t";
            result += c.getChunk().chunkZ + "\t";
            result += c.getChunk().dim + "\t";
            result += c.getDataSum() + "\n";
        }

        o.write(result.getBytes("UTF-8"));
    }

    private void readConfig() {
		log.info("Opis Dumper is reading its config.");
        this.didReadConfig = true;
        try (FileInputStream is = new FileInputStream(CONFIG_PATH)) {
            try (InputStreamReader reader = new InputStreamReader(is)) {
                try (BufferedReader br = new BufferedReader(new InputStreamReader(is))) {
                    String line;
                    while ((line = br.readLine()) != null) {
                        doWithConfigLine(line);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error reading Opis Dumper config: " + e.getMessage());
            dumpIntervalMinutes = DEFAULT_DUMP_INTERVAL_MINUTES;
            dumpLines = DEFAULT_DUMP_LINES;
            runOnStart = DEFAULT_RUN_ON_START;
        }
    }

    private void doWithConfigLine(String line) {
        line = line.trim();
        if (line.length() < 1) {
            return;
        }
        if (line.charAt(0) == '#') {
            return;
        }
        int eqPos = line.indexOf('=');
        if (eqPos <= 0 || eqPos >= line.length() - 1) {
            return;
        }
        String key = line.substring(0, eqPos).trim();
        String value = line.substring(eqPos + 1).trim();

        if (key.equals("dumpIntervalMinutes")) {
            dumpIntervalMinutes = parseIntWithDefault(value, DEFAULT_DUMP_INTERVAL_MINUTES);
        } else if (key.equals("dumpLines")) {
            dumpLines = parseIntWithDefault(value, DEFAULT_DUMP_LINES);
        } else if (key.equals("runOnStart")) {
            runOnStart = key.equals("true");
        }
    }

    private int parseIntWithDefault(String str, int dflt) {
        try {
            return Integer.parseInt(str);
        } catch (Exception e) {
            return dflt;
        }
    }
}
