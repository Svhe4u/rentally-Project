import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { Colors } from '../constants/colors';
import BottomNav, { TabName } from '../components/BottomNav';

interface Props {
  onNavigate: (tab: TabName) => void;
}

interface ClusterProps {
  label: string;
  top: string;
  left: string;
  size?: number;
  selected?: boolean;
}

function Cluster({ label, top, left, size = 40, selected = false }: ClusterProps) {
  return (
    <TouchableOpacity
      style={[
        styles.cluster,
        {
          top: top as any,
          left: left as any,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: selected ? Colors.red : Colors.primary,
        },
      ]}
      activeOpacity={0.85}
    >
      <Text style={[styles.clusterTxt, { fontSize: size < 36 ? 11 : 14 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function MapScreen({ onNavigate }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.typePill}>
          <Text style={styles.typePillTxt}>Нэг/Хоёр өрөө</Text>
        </View>
        <View style={styles.searchBar}>
          <Text style={styles.searchTxt}>Дүүрэг, метро, их сургууль...</Text>
          <Text>🔍</Text>
        </View>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <View style={styles.filterIconBtn}>
          <Text>⚙️</Text>
        </View>
        <TouchableOpacity style={styles.filterPill} activeOpacity={0.8}>
          <Text style={styles.filterPillTxt}>Гэрээний төрөл / Үнэ ▾</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterPill} activeOpacity={0.8}>
          <Text style={styles.filterPillTxt}>Өрөөний хэмжээ ▾</Text>
        </TouchableOpacity>
      </View>

      {/* Fake map */}
      <View style={styles.mapBody}>
        <View style={styles.fakeMap}>
          {/* Road grid */}
          <View style={[styles.roadH, styles.roadMainH, { top: '38%' }]} />
          <View style={[styles.roadH, { top: '22%' }]} />
          <View style={[styles.roadH, { top: '60%' }]} />
          <View style={[styles.roadV, styles.roadMainV, { left: '38%' }]} />
          <View style={[styles.roadV, { left: '62%' }]} />
          <View style={[styles.roadV, { left: '20%' }]} />

          {/* Clusters */}
          <Cluster label="6" top="15%" left="28%" />
          <Cluster label="1" top="15%" left="44%" />
          <Cluster label="2" top="42%" left="18%" />
          <Cluster label="3" top="42%" left="55%" selected />
          <Cluster label="7"  top="38%" left="32%" size={28} />
          <Cluster label="2"  top="44%" left="40%" size={26} />
          <Cluster label="3"  top="41%" left="47%" size={26} />
          <Cluster label="1"  top="46%" left="50%" size={26} />
          <Cluster label="14" top="54%" left="36%" size={26} />

          {/* Station marker */}
          <View style={styles.stationMarker}>
            <Text style={styles.stationTxt}>🚇 Баянгол</Text>
          </View>

          {/* AI button */}
          <TouchableOpacity style={styles.aiBtn} activeOpacity={0.85}>
            <Text style={styles.aiBtnTxt}>🤖 AI байр хайх</Text>
          </TouchableOpacity>

          {/* Right side panel */}
          <View style={styles.sidePanel}>
            {['🔧 Хэрэгсэл', '💹 Үнэ', '🏢 Зуучлал', '🎓 Сургууль', '🚇 Тээвэр', '👁 Нуух'].map(
              (item) => (
                <TouchableOpacity key={item} style={styles.sideItem} activeOpacity={0.7}>
                  <Text style={styles.sideItemTxt}>{item}</Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {/* GPS button */}
          <TouchableOpacity style={styles.gpsBtn} activeOpacity={0.8}>
            <Text style={{ fontSize: 18 }}>📍</Text>
          </TouchableOpacity>

          {/* Toast */}
          <View style={styles.toast}>
            <Text style={styles.toastTxt}>🔔 Шинэ байрны мэдэгдэл авах!</Text>
          </View>
        </View>
      </View>

      {/* Bottom label */}
      <View style={styles.bottomLabel}>
        <Text style={styles.bottomLabelTxt}>Зар</Text>
      </View>

      <BottomNav active="map" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

  topBar: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  typePill: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  typePillTxt: { color: Colors.white, fontSize: 12, fontWeight: '800' },
  searchBar: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: 22,
    paddingVertical: 9,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchTxt: { fontSize: 12, color: Colors.textLight },

  filterBar: {
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterIconBtn: {
    width: 34,
    height: 34,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPill: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.white,
  },
  filterPillTxt: { fontSize: 12, fontWeight: '700', color: '#333' },

  mapBody: { flex: 1, position: 'relative', overflow: 'hidden' },
  fakeMap: {
    flex: 1,
    backgroundColor: '#e5ecdd',
    position: 'relative',
  },

  roadH: {
    position: 'absolute',
    height: 6,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 3,
  },
  roadV: {
    position: 'absolute',
    width: 6,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    borderRadius: 3,
  },
  roadMainH: { height: 10, backgroundColor: '#f5d98b' },
  roadMainV: { width: 10, backgroundColor: '#f5a47a' },

  cluster: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  clusterTxt: { color: Colors.white, fontWeight: '900' },

  stationMarker: {
    position: 'absolute',
    top: '49%',
    left: '27%',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stationTxt: { color: Colors.white, fontSize: 11, fontWeight: '700' },

  aiBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.white,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  aiBtnTxt: { fontSize: 13, fontWeight: '800', color: Colors.primary },

  sidePanel: {
    position: 'absolute',
    right: 0,
    top: 50,
    backgroundColor: Colors.white,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sideItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  sideItemTxt: { fontSize: 13, fontWeight: '700', color: '#333', textAlign: 'center' },

  gpsBtn: {
    position: 'absolute',
    right: 70,
    bottom: 70,
    width: 40,
    height: 40,
    backgroundColor: Colors.white,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  toast: {
    position: 'absolute',
    bottom: 14,
    alignSelf: 'center',
    left: '10%',
    right: '10%',
    backgroundColor: '#111',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  toastTxt: { color: Colors.white, fontSize: 13, fontWeight: '700' },

  bottomLabel: {
    backgroundColor: Colors.white,
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  bottomLabelTxt: { fontSize: 14, fontWeight: '800', color: Colors.text },
});
