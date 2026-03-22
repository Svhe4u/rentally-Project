import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, ScrollView, Modal, FlatList, Platform,
} from 'react-native';
import BottomNav, { TabName } from '../components/BottomNav';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAhcTN2Y9g3NpsaRus5Yc7rSvTsnhdE5FY';

interface Props { onNavigate: (tab: TabName) => void; onOpenDetail?: (id: number) => void; }
interface Listing { id:number; title:string; price:string; lat:number; lng:number; district:string; committee:string; rooms:number; area:number; }
interface District { id:string; name:string; lat:number; lng:number; zoom:number; }
interface Committee { id:string; name:string; districtId:string; lat:number; lng:number; }

const UB = { lat: 47.9077, lng: 106.8832 };

const DISTRICTS: District[] = [
  { id:'bayanzurkh', name:'Баянзүрх',      lat:47.920, lng:106.970, zoom:13 },
  { id:'sukhbaatar', name:'Сүхбаатар',      lat:47.920, lng:106.845, zoom:13 },
  { id:'khan_uul',   name:'Хан-Уул',         lat:47.860, lng:106.900, zoom:13 },
  { id:'bayangol',   name:'Баянгол',         lat:47.900, lng:106.820, zoom:13 },
  { id:'songino',    name:'Сонгинохайрхан', lat:47.940, lng:106.750, zoom:12 },
  { id:'chingeltei', name:'Чингэлтэй',      lat:47.930, lng:106.870, zoom:13 },
  { id:'nalaikh',    name:'Налайх',          lat:47.760, lng:107.270, zoom:13 },
  { id:'baganuur',   name:'Багануур',        lat:47.710, lng:108.280, zoom:13 },
];

const COMMITTEES: Committee[] = [
  { id:'bz_1',  name:'1-р хороо',  districtId:'bayanzurkh', lat:47.925, lng:106.955 },
  { id:'bz_3',  name:'3-р хороо',  districtId:'bayanzurkh', lat:47.930, lng:106.970 },
  { id:'bz_15', name:'15-р хороо', districtId:'bayanzurkh', lat:47.910, lng:106.980 },
  { id:'sb_1',  name:'1-р хороо',  districtId:'sukhbaatar', lat:47.920, lng:106.835 },
  { id:'sb_4',  name:'4-р хороо',  districtId:'sukhbaatar', lat:47.915, lng:106.850 },
  { id:'ku_1',  name:'1-р хороо',  districtId:'khan_uul',   lat:47.865, lng:106.880 },
  { id:'ku_8',  name:'8-р хороо',  districtId:'khan_uul',   lat:47.855, lng:106.915 },
  { id:'bg_1',  name:'1-р хороо',  districtId:'bayangol',   lat:47.910, lng:106.815 },
  { id:'bg_7',  name:'7-р хороо',  districtId:'bayangol',   lat:47.895, lng:106.825 },
  { id:'ct_1',  name:'1-р хороо',  districtId:'chingeltei', lat:47.928, lng:106.860 },
  { id:'ct_3',  name:'3-р хороо',  districtId:'chingeltei', lat:47.932, lng:106.875 },
  { id:'sk_1',  name:'1-р хороо',  districtId:'songino',    lat:47.945, lng:106.742 },
  { id:'sk_5',  name:'5-р хороо',  districtId:'songino',    lat:47.935, lng:106.760 },
];

const MOCK_LISTINGS: Listing[] = [
  { id:1,  title:'2 өрөө орон сууц',   price:'900,000 ₮',   lat:47.9200, lng:106.9600, district:'bayanzurkh', committee:'bz_15', rooms:2, area:55 },
  { id:2,  title:'1 өрөө орон сууц',   price:'650,000 ₮',   lat:47.9190, lng:106.8380, district:'sukhbaatar', committee:'sb_1',  rooms:1, area:32 },
  { id:3,  title:'Гэр хороолол байр',  price:'500,000 ₮',   lat:47.8620, lng:106.9000, district:'khan_uul',   committee:'ku_1',  rooms:1, area:28 },
  { id:4,  title:'3 өрөө тансаг байр', price:'1,200,000 ₮', lat:47.9080, lng:106.8200, district:'bayangol',   committee:'bg_7',  rooms:3, area:80 },
  { id:5,  title:'2 өрөө орон сууц',   price:'850,000 ₮',   lat:47.9300, lng:106.8680, district:'chingeltei', committee:'ct_1',  rooms:2, area:60 },
  { id:6,  title:'Студи апартмент',    price:'550,000 ₮',   lat:47.9150, lng:106.9750, district:'bayanzurkh', committee:'bz_3',  rooms:1, area:25 },
  { id:7,  title:'2 өрөө шинэ байр',   price:'950,000 ₮',   lat:47.9160, lng:106.8450, district:'sukhbaatar', committee:'sb_4',  rooms:2, area:58 },
  { id:8,  title:'1 өрөө затвор',      price:'700,000 ₮',   lat:47.9050, lng:106.8230, district:'bayangol',   committee:'bg_1',  rooms:1, area:38 },
  { id:9,  title:'2 өрөө Сонгино',     price:'620,000 ₮',   lat:47.9410, lng:106.7480, district:'songino',    committee:'sk_1',  rooms:2, area:50 },
  { id:10, title:'1 өрөө Чингэлтэй',  price:'720,000 ₮',   lat:47.9290, lng:106.8720, district:'chingeltei', committee:'ct_3',  rooms:1, area:35 },
];

// ─── Build Google Maps HTML ────────────────────────────────────
function buildMapHTML(listings: Listing[], center:{lat:number,lng:number}, initZoom:number) {
  const listingsJSON = JSON.stringify(listings);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;overflow:hidden}
.pp{background:#2e55fa;color:#fff;padding:5px 11px;border-radius:20px;font-size:12px;font-weight:900;border:2.5px solid #fff;box-shadow:0 3px 10px rgba(46,85,250,0.5);cursor:pointer;white-space:nowrap;font-family:system-ui,sans-serif;transition:transform .15s}
.pp:hover{transform:scale(1.08)}
.pp.hot{background:#ff3b5c}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map,activeId=null,overlays=[];
var listings=${listingsJSON};
function notify(obj){
  try{
    if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    else window.parent.postMessage(JSON.stringify(obj),'*');
  }catch(e){}
}
function initMap(){
  map=new google.maps.Map(document.getElementById('map'),{
    center:{lat:${center.lat},lng:${center.lng}},zoom:${initZoom},
    disableDefaultUI:true,zoomControl:true,gestureHandling:'greedy',clickableIcons:false,
    styles:[
      {featureType:'poi',stylers:[{visibility:'off'}]},
      {featureType:'landscape',elementType:'geometry',stylers:[{color:'#eaf2e5'}]},
      {featureType:'road',elementType:'geometry',stylers:[{color:'#ffffff'}]},
      {featureType:'road.arterial',elementType:'geometry',stylers:[{color:'#fde9a2'}]},
      {featureType:'road.highway',elementType:'geometry',stylers:[{color:'#fbcb7e'}]},
      {featureType:'water',elementType:'geometry',stylers:[{color:'#aad3df'}]},
      {featureType:'building',elementType:'geometry.fill',stylers:[{color:'#dce9d5'}]},
    ]
  });
  map.addListener('zoom_changed',function(){notify({type:'zoom',zoom:map.getZoom()});renderPins();});
  renderPins();
}
function clearAll(){
  overlays.forEach(function(o){
    if(o&&o.setMap)o.setMap(null);
    if(o&&o._el&&o._el.parentNode)o._el.parentNode.removeChild(o._el);
  });
  overlays=[];
}
function renderPins(){
  clearAll();
  var z=map.getZoom();
  listings.forEach(function(L){
    var hot=L.id===activeId;
    if(z>=14){
      var ov=new google.maps.OverlayView();
      ov._L=L;ov._hot=hot;
      ov.onAdd=function(){
        var el=document.createElement('div');
        el.className='pp'+(this._hot?' hot':'');
        el.innerText=this._L.price;
        var self=this;
        el.addEventListener('click',function(e){e.stopPropagation();activeId=self._L.id;notify({type:'click',listing:self._L});renderPins();});
        this._el=el;
        this.getPanes().overlayMouseTarget.appendChild(el);
      };
      ov.draw=function(){
        var pt=this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(this._L.lat,this._L.lng));
        if(pt&&this._el){this._el.style.position='absolute';this._el.style.left=(pt.x-40)+'px';this._el.style.top=(pt.y-18)+'px';}
      };
      ov.onRemove=function(){if(this._el&&this._el.parentNode)this._el.parentNode.removeChild(this._el);};
      ov.setMap(map);overlays.push(ov);
    } else {
      var mk=new google.maps.Marker({
        position:{lat:L.lat,lng:L.lng},map:map,
        icon:{path:google.maps.SymbolPath.CIRCLE,scale:hot?20:15,fillColor:hot?'#ff3b5c':'#2e55fa',fillOpacity:1,strokeColor:'#fff',strokeWeight:3},
        label:{text:'₮',color:'#fff',fontWeight:'900',fontSize:'11px'}
      });
      (function(m,l){m.addListener('click',function(){activeId=l.id;notify({type:'click',listing:l});renderPins();});})(mk,L);
      overlays.push(mk);
    }
  });
}
window.goTo=function(lat,lng,zoom){map.panTo({lat:lat,lng:lng});if(zoom)map.setZoom(zoom);};
window.updateListings=function(data){listings=data;activeId=null;renderPins();};
</script>
<script async defer src="https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap&language=mn"></script>
</body>
</html>`;
}

// ─── Web-only iframe map ───────────────────────────────────────
// Only imported/used when Platform.OS === 'web'
function WebMap({ html, iframeRef }: { html: string; iframeRef: React.MutableRefObject<any> }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [html]);

  if (!src) return null;

  // @ts-ignore - iframe is a valid web element
  return <iframe ref={iframeRef} src={src} style={{ width:'100%', height:'100%', border:'none' }} title="map" />;
}

// ─── Main component ────────────────────────────────────────────
export default function MapScreen({ onNavigate, onOpenDetail }: Props) {
  const mapRef = useRef<any>(null);   // iframe ref (web) or WebView ref (native)
  const [zoom, setZoom] = useState(12);
  const [query, setQuery] = useState('');
  const [districtModal, setDistrictModal] = useState(false);
  const [committeeModal, setCommitteeModal] = useState(false);
  const [selDistrict, setSelDistrict] = useState<District | null>(null);
  const [selCommittee, setSelCommittee] = useState<Committee | null>(null);
  const [selListing, setSelListing] = useState<Listing | null>(null);
  const [roomFilter, setRoomFilter] = useState<number | null>(null);
  const [listings, setListings] = useState<Listing[]>(MOCK_LISTINGS);

  const isWeb = Platform.OS === 'web';

  // ── Listen for postMessage from iframe (web only) ────────────
  useEffect(() => {
    if (!isWeb) return;
    const handler = (e: MessageEvent) => {
      try { handleMsg(JSON.parse(typeof e.data === 'string' ? e.data : JSON.stringify(e.data))); } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // ── Filter listings ──────────────────────────────────────────
  useEffect(() => {
    let res = MOCK_LISTINGS;
    if (selDistrict)  res = res.filter(l => l.district === selDistrict.id);
    if (selCommittee) res = res.filter(l => l.committee === selCommittee.id);
    if (roomFilter)   res = res.filter(l => l.rooms === roomFilter);
    setListings(res);
    evalInMap(`window.updateListings && window.updateListings(${JSON.stringify(res)})`);
  }, [selDistrict, selCommittee, roomFilter]);

  const evalInMap = (js: string) => {
    if (isWeb) {
      try { mapRef.current?.contentWindow?.eval(js); } catch {}
    } else {
      mapRef.current?.injectJavaScript(js + '; true;');
    }
  };

  const handleMsg = (d: any) => {
    if (!d) return;
    if (d.type === 'zoom') setZoom(d.zoom);
    if (d.type === 'click') setSelListing(d.listing);
  };

  const panTo = (lat: number, lng: number, z: number) =>
    evalInMap(`window.goTo && window.goTo(${lat},${lng},${z})`);

  const pickDistrict = (d: District) => {
    setSelDistrict(d); setSelCommittee(null); setDistrictModal(false);
    panTo(d.lat, d.lng, d.zoom);
  };
  const pickCommittee = (c: Committee) => {
    setSelCommittee(c); setCommitteeModal(false);
    panTo(c.lat, c.lng, 15);
  };
  const clearAll = () => {
    setSelDistrict(null); setSelCommittee(null); setRoomFilter(null); setSelListing(null);
    panTo(UB.lat, UB.lng, 12);
  };
  const doSearch = () => {
    const q = query.trim().toLowerCase();
    if (!q) return;
    const d = DISTRICTS.find(x => x.name.toLowerCase().includes(q));
    if (d) { pickDistrict(d); return; }
    const c = COMMITTEES.find(x => x.name.toLowerCase().includes(q));
    if (c) { const p = DISTRICTS.find(x => x.id === c.districtId); if (p) setSelDistrict(p); pickCommittee(c); }
  };

  const committees = selDistrict ? COMMITTEES.filter(c => c.districtId === selDistrict.id) : COMMITTEES;
  const mapHTML = buildMapHTML(listings, UB, zoom);

  // ── Render map area ──────────────────────────────────────────
  const renderMapView = () => {
    if (isWeb) {
      return <WebMap html={mapHTML} iframeRef={mapRef} />;
    }
    // Native: lazy require so web bundle never touches this module
    try {
      const { WebView } = require('react-native-webview');
      return (
        <WebView
          ref={mapRef}
          source={{ html: mapHTML }}
          style={{ flex: 1, backgroundColor: '#eaf2e5' }}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          onMessage={(e: any) => { try { handleMsg(JSON.parse(e.nativeEvent.data)); } catch {} }}
        />
      );
    } catch {
      return (
        <View style={s.fallback}>
          <Text style={s.fallbackEmoji}>🗺️</Text>
          <Text style={s.fallbackTitle}>Газрын зураг</Text>
          <Text style={s.fallbackSub}>react-native-webview суулгана уу:</Text>
          <View style={s.fallbackCode}><Text style={s.fallbackCodeTxt}>npx expo install react-native-webview</Text></View>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      {/* Search bar */}
      <View style={s.topBar}>
        <View style={s.searchRow}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.input}
            placeholder="Дүүрэг, хороо хайх..."
            placeholderTextColor="#aaa"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={doSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={s.xBtn}>✕</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={s.searchBtn} onPress={doSearch}>
            <Text style={s.searchBtnTxt}>Хайх</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipBar} contentContainerStyle={s.chipScroll}>
        <TouchableOpacity style={[s.chip, !!selDistrict && s.chipOn]} onPress={() => setDistrictModal(true)}>
          <Text style={[s.chipTxt, !!selDistrict && s.chipTxtOn]}>🏙 {selDistrict?.name ?? 'Дүүрэг'} ▾</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.chip, !!selCommittee && s.chipOn]} onPress={() => setCommitteeModal(true)}>
          <Text style={[s.chipTxt, !!selCommittee && s.chipTxtOn]}>📍 {selCommittee?.name ?? 'Хороо'} ▾</Text>
        </TouchableOpacity>
        {[1,2,3].map(r => (
          <TouchableOpacity key={r} style={[s.chip, roomFilter===r && s.chipOn]} onPress={() => setRoomFilter(roomFilter===r ? null : r)}>
            <Text style={[s.chipTxt, roomFilter===r && s.chipTxtOn]}>{r} өрөө</Text>
          </TouchableOpacity>
        ))}
        {(selDistrict || selCommittee || roomFilter) && (
          <TouchableOpacity style={s.chipRed} onPress={clearAll}>
            <Text style={s.chipRedTxt}>✕ Цэвэрлэх</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Map */}
      <View style={s.mapWrap}>
        {renderMapView()}
        <View style={s.zoomBadge} pointerEvents="none">
          <Text style={s.zoomTxt}>🔭 zoom {zoom}</Text>
        </View>
        <View style={s.countBadge} pointerEvents="none">
          <Text style={s.countTxt}>🏠 {listings.length} байр</Text>
        </View>
        <TouchableOpacity style={s.aiBtn}>
          <Text style={s.aiBtnTxt}>🤖 AI байр хайх</Text>
        </TouchableOpacity>
      </View>

      {/* Listing bottom-sheet modal */}
      <Modal
        visible={!!selListing}
        transparent
        animationType="slide"
        onRequestClose={() => setSelListing(null)}
      >
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setSelListing(null)}>
          <TouchableOpacity activeOpacity={1} style={s.cardSheet}>
            <View style={s.handle} />
            {selListing && (
              <>
                <View style={s.cardRow}>
                  <View style={s.cardLeft}>
                    <View style={s.badge}>
                      <Text style={s.badgeTxt}>{selListing.rooms} өрөө · {selListing.area}м²</Text>
                    </View>
                    <Text style={s.cardTitle}>{selListing.title}</Text>
                    <Text style={s.cardMeta}>{DISTRICTS.find(d=>d.id===selListing.district)?.name}</Text>
                  </View>
                  <View style={s.cardRight}>
                    <Text style={s.cardPrice}>{selListing.price}</Text>
                    <Text style={s.cardSub}>/сар</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={s.cardBtn}
                  onPress={() => { setSelListing(null); onOpenDetail?.(selListing.id); }}
                >
                  <Text style={s.cardBtnTxt}>Харах →</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* District modal */}
      <Modal visible={districtModal} transparent animationType="slide" onRequestClose={() => setDistrictModal(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setDistrictModal(false)}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>🏙 Дүүрэг сонгох</Text>
            <FlatList data={DISTRICTS} keyExtractor={d=>d.id}
              renderItem={({item:d}) => (
                <TouchableOpacity style={[s.row, selDistrict?.id===d.id&&s.rowOn]} onPress={() => pickDistrict(d)}>
                  <Text style={[s.rowTxt, selDistrict?.id===d.id&&s.rowTxtOn]}>{d.name}</Text>
                  {selDistrict?.id===d.id && <Text style={s.check}>✓</Text>}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={s.sep} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Committee modal */}
      <Modal visible={committeeModal} transparent animationType="slide" onRequestClose={() => setCommitteeModal(false)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setCommitteeModal(false)}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>📍 {selDistrict ? selDistrict.name+' — ' : ''}Хороо сонгох</Text>
            {committees.length === 0
              ? <Text style={s.empty}>Эхлээд дүүрэг сонгоно уу</Text>
              : <FlatList data={committees} keyExtractor={c=>c.id}
                  renderItem={({item:c}) => (
                    <TouchableOpacity style={[s.row, selCommittee?.id===c.id&&s.rowOn]} onPress={() => pickCommittee(c)}>
                      <Text style={[s.rowTxt, selCommittee?.id===c.id&&s.rowTxtOn]}>{c.name}</Text>
                      {selCommittee?.id===c.id && <Text style={s.check}>✓</Text>}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={s.sep} />}
                />
            }
          </View>
        </TouchableOpacity>
      </Modal>

      <BottomNav active="map" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#f4f5f7'},
  topBar:{backgroundColor:'#fff',paddingHorizontal:12,paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#e8e8ec'},
  searchRow:{flexDirection:'row',alignItems:'center',backgroundColor:'#f4f5f7',borderRadius:22,paddingHorizontal:14,paddingVertical:9,gap:8},
  searchIcon:{fontSize:16},
  input:{flex:1,fontSize:14,color:'#111',padding:0},
  xBtn:{fontSize:13,color:'#aaa',paddingHorizontal:4},
  searchBtn:{backgroundColor:'#2e55fa',borderRadius:14,paddingVertical:6,paddingHorizontal:12},
  searchBtnTxt:{color:'#fff',fontSize:12,fontWeight:'800'},
  chipBar:{backgroundColor:'#fff',borderBottomWidth:1,borderBottomColor:'#e8e8ec',maxHeight:52},
  chipScroll:{paddingHorizontal:12,paddingVertical:10,gap:8,flexDirection:'row',alignItems:'center'},
  chip:{borderWidth:1.5,borderColor:'#e8e8ec',borderRadius:20,paddingVertical:5,paddingHorizontal:12,backgroundColor:'#fff'},
  chipOn:{borderColor:'#2e55fa',backgroundColor:'#eef1ff'},
  chipTxt:{fontSize:12,fontWeight:'700',color:'#444'},
  chipTxtOn:{color:'#2e55fa'},
  chipRed:{borderWidth:1.5,borderColor:'#ff3b5c',borderRadius:20,paddingVertical:5,paddingHorizontal:12,backgroundColor:'#fff5f5'},
  chipRedTxt:{fontSize:12,fontWeight:'700',color:'#ff3b5c'},
  mapWrap:{flex:1,position:'relative'},
  fallback:{flex:1,backgroundColor:'#eaf2e5',alignItems:'center',justifyContent:'center',gap:10,padding:32},
  fallbackEmoji:{fontSize:56},
  fallbackTitle:{fontSize:18,fontWeight:'900',color:'#3a6b3a'},
  fallbackSub:{fontSize:13,color:'#5a8a5a'},
  fallbackCode:{backgroundColor:'#111',borderRadius:10,paddingVertical:10,paddingHorizontal:16,marginTop:4},
  fallbackCodeTxt:{color:'#7fff7f',fontFamily:'monospace',fontSize:12},
  zoomBadge:{position:'absolute',bottom:12,right:12,backgroundColor:'rgba(0,0,0,0.6)',borderRadius:12,paddingVertical:5,paddingHorizontal:10},
  zoomTxt:{color:'#fff',fontSize:11,fontWeight:'800'},
  countBadge:{position:'absolute',top:12,left:12,backgroundColor:'#fff',borderRadius:16,paddingVertical:6,paddingHorizontal:12,shadowColor:'#000',shadowOffset:{width:0,height:2},shadowOpacity:0.12,shadowRadius:6,elevation:4},
  countTxt:{fontSize:13,fontWeight:'900',color:'#111'},
  aiBtn:{position:'absolute',top:12,right:12,backgroundColor:'#fff',borderRadius:20,paddingVertical:9,paddingHorizontal:14,shadowColor:'#000',shadowOffset:{width:0,height:3},shadowOpacity:0.15,shadowRadius:8,elevation:5},
  aiBtnTxt:{fontSize:13,fontWeight:'800',color:'#2e55fa'},
  cardSheet:{backgroundColor:'#fff',borderTopLeftRadius:24,borderTopRightRadius:24,paddingTop:10,paddingHorizontal:20,paddingBottom:36,gap:14},
  cardRow:{flexDirection:'row',alignItems:'center',gap:12},
  cardLeft:{flex:1,gap:4},
  badge:{backgroundColor:'#eef1ff',borderRadius:8,paddingVertical:3,paddingHorizontal:8,alignSelf:'flex-start'},
  badgeTxt:{fontSize:11,fontWeight:'800',color:'#2e55fa'},
  cardTitle:{fontSize:16,fontWeight:'900',color:'#111'},
  cardMeta:{fontSize:13,color:'#888'},
  cardRight:{alignItems:'flex-end',gap:2},
  cardPrice:{fontSize:20,fontWeight:'900',color:'#2e55fa'},
  cardSub:{fontSize:11,color:'#aaa'},
  cardBtn:{backgroundColor:'#2e55fa',borderRadius:14,paddingVertical:14,alignItems:'center'},
  cardBtnTxt:{color:'#fff',fontSize:15,fontWeight:'900'},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.45)',justifyContent:'flex-end'},
  sheet:{backgroundColor:'#fff',borderTopLeftRadius:24,borderTopRightRadius:24,paddingTop:10,paddingBottom:36,maxHeight:'65%'},
  handle:{width:38,height:4,borderRadius:2,backgroundColor:'#e0e0e0',alignSelf:'center',marginBottom:14},
  sheetTitle:{fontSize:17,fontWeight:'900',color:'#111',paddingHorizontal:20,marginBottom:8},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:15,paddingHorizontal:20},
  rowOn:{backgroundColor:'#eef1ff'},
  rowTxt:{fontSize:15,fontWeight:'600',color:'#222'},
  rowTxtOn:{color:'#2e55fa',fontWeight:'800'},
  check:{fontSize:16,color:'#2e55fa',fontWeight:'900'},
  sep:{height:1,backgroundColor:'#f0f0f0',marginHorizontal:20},
  empty:{textAlign:'center',color:'#aaa',fontSize:14,padding:28},
});