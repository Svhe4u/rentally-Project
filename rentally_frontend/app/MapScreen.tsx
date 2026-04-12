import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  TextInput, ScrollView, Modal, FlatList, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { ListingAPI, Listing as BackendListing } from '../services/api';
import BottomNav, { TabName } from '../components/BottomNav';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAhcTN2Y9g3NpsaRus5Yc7rSvTsnhdE5FY';

interface Props { onNavigate: (tab: TabName) => void; onOpenDetail?: (id: number) => void; }
interface MapListing { id:number; title:string; price:string; lat:number; lng:number; district:string; committee:string; rooms:number; area:number; }
interface District { id: number | string; name: string; lat: number; lng: number; zoom: number; }
interface Committee { id: number | string; name: string; districtId: string | number; lat: number; lng: number; }

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

// ─── Build Google Maps HTML ────────────────────────────────────
function buildMapHTML(listings: MapListing[], center:{lat:number,lng:number}, initZoom:number) {
  const listingsJSON = JSON.stringify(listings);
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;overflow:hidden;background:#f8f9fa}
.pp{
  background:#ffffff;color:#1a1a1a;padding:6px 14px;border-radius:22px;
  font-size:14px;font-weight:800;border:1px solid rgba(0,0,0,0.08);
  box-shadow:0 4px 12px rgba(0,0,0,0.12);cursor:pointer;
  white-space:nowrap;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  transition:all 0.2s cubic-bezier(0.2, 0, 0, 1);
  display:flex;align-items:center;justify-content:center;
}
.pp:active{transform:scale(0.92)}
.pp.hot{background:#222;color:#fff;border-color:#000;z-index:999 !important;box-shadow:0 8px 16px rgba(0,0,0,0.25);transform:scale(1.1)}
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
    disableDefaultUI:true,zoomControl:false,gestureHandling:'greedy',clickableIcons:false,
    styles:[
      {featureType:'all',elementType:'labels.text.fill',stylers:[{color:'#7c93a3'}]},
      {featureType:'all',elementType:'labels.text.stroke',stylers:[{visibility:'off'}]},
      {featureType:'landscape',elementType:'geometry',stylers:[{color:'#f5f5f5'}]},
      {featureType:'poi',stylers:[{visibility:'off'}]},
      {featureType:'road',elementType:'geometry',stylers:[{color:'#ffffff'}]},
      {featureType:'road.highway',elementType:'geometry',stylers:[{color:'#ffffff'}]},
      {featureType:'road.highway',elementType:'labels',stylers:[{visibility:'off'}]},
      {featureType:'water',elementType:'geometry',stylers:[{color:'#deebf4'}]},
      {featureType:'water',elementType:'labels.text.fill',stylers:[{color:'#92998d'}]}
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
    if(z>=13){
      var ov=new google.maps.OverlayView();
      ov._L=L;ov._hot=hot;
      ov.onAdd=function(){
        var el=document.createElement('div');
        el.className='pp'+(this._hot?' hot':'');
        el.innerText=this._L.price;
        var self=this;
        el.addEventListener('click',function(e){e.stopPropagation();activeId=self._L.id;notify({type:'click',listing:self._L});renderPins();});
        this._el=el;
        if(this._hot)this._el.style.zIndex="999";
        this.getPanes().overlayMouseTarget.appendChild(el);
      };
      ov.draw=function(){
        var pt=this.getProjection().fromLatLngToDivPixel(new google.maps.LatLng(this._L.lat,this._L.lng));
        if(pt&&this._el){
          this._el.style.position='absolute';
          this._el.style.left=(pt.x-35)+'px';
          this._el.style.top=(pt.y-18)+'px';
        }
      };
      ov.onRemove=function(){if(this._el&&this._el.parentNode)this._el.parentNode.removeChild(this._el);};
      ov.setMap(map);overlays.push(ov);
    } else {
      var mk=new google.maps.Marker({
        position:{lat:L.lat,lng:L.lng},map:map,
        icon:{
          path:'M0-48c-9.8 0-17.7 7.8-17.7 17.4 0 15.5 17.7 30.6 17.7 30.6s17.7-15.4 17.7-30.6c0-9.6-7.9-17.4-17.7-17.4z',
          fillColor:hot?'#000':'#2e55fa',fillOpacity:1,strokeColor:'#fff',strokeWeight:2,scale:0.7,anchor:new google.maps.Point(0,0)
        }
      });
      (function(m,l){m.addListener('click',function(){activeId=l.id;notify({type:'click',listing:l});renderPins();});})(mk,L);
      overlays.push(mk);
    }
  });
}
window.goTo=function(lat,lng,zoom){map.panTo({lat:lat,lng:lng});if(zoom)map.setZoom(zoom);};
window.updateListings=function(data){listings=data;renderPins();};
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
  const [selListing, setSelListing] = useState<MapListing | null>(null);
  const [roomFilter, setRoomFilter] = useState<number | null>(null);
  const [listings, setListings] = useState<MapListing[]>([]);
  const [loading, setLoading] = useState(true);

  const isWeb = Platform.OS === 'web';

  // ── Fetch real data from Backend ────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = { search: query };
      if (selDistrict) params.region_id = selDistrict.id;
      
      const res = await ListingAPI.list(params);
      
      const serverItems = res.results || [];
      const mapped = serverItems.map((l: BackendListing) => ({
        id: l.id,
        title: l.title,
        price: (l.price || 0).toLocaleString() + ' ₮', 
        lat: l.latitude || UB.lat, 
        lng: l.longitude || UB.lng,
        district: l.region_id?.toString() || '',
        committee: '', 
        rooms: l.bedrooms || 1,
        area: l.area_sqm ? Math.round(Number(l.area_sqm)) : 0
      }));
      
      setListings(mapped);
      evalInMap(`window.updateListings && window.updateListings(${JSON.stringify(mapped)})`);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selDistrict, selCommittee, roomFilter]);

  // ── Listen for postMessage from iframe (web only) ────────────
  useEffect(() => {
    if (!isWeb) return;
    const handler = (e: MessageEvent) => {
      try { handleMsg(JSON.parse(typeof e.data === 'string' ? e.data : JSON.stringify(e.data))); } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

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
      {/* Floating Top UI */}
      <View style={s.floatingTop}>
        <View style={s.searchRow}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={s.input}
            placeholder="Хаана байр хайж байна?"
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={doSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipBar} contentContainerStyle={s.chipScroll}>
          <TouchableOpacity style={[s.chip, !!selDistrict && s.chipOn]} onPress={() => setDistrictModal(true)}>
            <Text style={[s.chipTxt, !!selDistrict && s.chipTxtOn]}>{selDistrict?.name ?? 'Дүүрэг'}</Text>
            <Ionicons name="chevron-down" size={12} color={selDistrict ? Colors.primary : Colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.chip, !!selCommittee && s.chipOn]} onPress={() => setCommitteeModal(true)}>
            <Text style={[s.chipTxt, !!selCommittee && s.chipTxtOn]}>{selCommittee?.name ?? 'Хороо'}</Text>
            <Ionicons name="chevron-down" size={12} color={selCommittee ? Colors.primary : Colors.textMuted} />
          </TouchableOpacity>
          {[1,2,3].map(r => (
            <TouchableOpacity key={r} style={[s.chip, roomFilter===r && s.chipOn]} onPress={() => setRoomFilter(roomFilter===r ? null : r)}>
              <Text style={[s.chipTxt, roomFilter===r && s.chipTxtOn]}>{r} өрөө</Text>
            </TouchableOpacity>
          ))}
          {(selDistrict || selCommittee || roomFilter) && (
            <TouchableOpacity style={s.chipReset} onPress={clearAll}>
              <Ionicons name="refresh" size={14} color="#fff" />
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Map Area */}
      <View style={s.mapWrap}>
        {renderMapView()}
        
        {/* Floating Controls */}
        <View style={s.leftControls}>
          <View style={s.glassBadge}>
            <Text style={s.glassBadgeTxt}>{listings.length} байр олдлоо</Text>
          </View>
        </View>

        <View style={s.rightControls}>
          <TouchableOpacity style={s.floatingBtn} onPress={() => panTo(UB.lat, UB.lng, 12)}>
            <Ionicons name="locate" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.floatingBtn, { marginTop: 12 }]} onPress={() => evalInMap('map.setZoom(map.getZoom()+1)')}>
            <Ionicons name="add" size={24} color={Colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={[s.floatingBtn, { marginTop: 4 }]} onPress={() => evalInMap('map.setZoom(map.getZoom()-1)')}>
            <Ionicons name="remove" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.aiFab}>
          <Ionicons name="sparkles" size={20} color="#fff" />
          <Text style={s.aiFabTxt}>AI Хайлт</Text>
        </TouchableOpacity>
      </View>

      {/* Listing bottom-sheet modal */}
      <Modal visible={!!selListing} transparent animationType="slide" onRequestClose={() => setSelListing(null)}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setSelListing(null)}>
          <TouchableOpacity activeOpacity={1} style={s.cardSheet}>
            <View style={s.handle} />
            {selListing && (
              <View style={s.cardContent}>
                <View style={s.cardImagePlaceholder}>
                  <Ionicons name="image-outline" size={40} color={Colors.border} />
                  <View style={s.priceBadge}>
                    <Text style={s.priceBadgeTxt}>{selListing.price}</Text>
                  </View>
                </View>
                
                <View style={s.cardInfo}>
                  <View style={s.cardMetaRow}>
                    <View style={s.tag}><Text style={s.tagTxt}>{selListing.rooms} өрөө</Text></View>
                    <View style={s.tag}><Text style={s.tagTxt}>{selListing.area}м²</Text></View>
                    <View style={s.rating}><Ionicons name="star" size={14} color="#FFD700" /><Text style={s.ratingTxt}>4.8</Text></View>
                  </View>
                  
                  <Text style={s.cardTitle}>{selListing.title}</Text>
                  <Text style={s.cardLoc}><Ionicons name="location-outline" size={14} /> {DISTRICTS.find(d=>d.id===selListing.district)?.name}, {COMMITTEES.find(c=>c.id===selListing.committee)?.name}</Text>
                  
                  <TouchableOpacity
                    style={s.mainBtn}
                    onPress={() => { setSelListing(null); onOpenDetail?.(selListing.id); }}
                  >
                    <Text style={s.mainBtnTxt}>Харах</Text>
                    <Ionicons name="arrow-forward" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
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
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({item:d}) => (
                <TouchableOpacity style={[s.row, selDistrict?.id===d.id&&s.rowOn]} onPress={() => pickDistrict(d)}>
                  <Text style={[s.rowTxt, selDistrict?.id===d.id&&s.rowTxtOn]}>{d.name}</Text>
                  {selDistrict?.id===d.id && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
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
            <Text style={s.sheetTitle}>📍 Сонгох</Text>
            {committees.length === 0
              ? <Text style={s.empty}>Эхлээд дүүрэг сонгоно уу</Text>
              : <FlatList data={committees} keyExtractor={c=>c.id}
                  contentContainerStyle={{ paddingBottom: 40 }}
                  renderItem={({item:c}) => (
                    <TouchableOpacity style={[s.row, selCommittee?.id===c.id&&s.rowOn]} onPress={() => pickCommittee(c)}>
                      <Text style={[s.rowTxt, selCommittee?.id===c.id&&s.rowTxtOn]}>{c.name}</Text>
                      {selCommittee?.id===c.id && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={s.sep} />}
                />
            }
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Nav */}
      <BottomNav active="map" onNavigate={onNavigate} />

      {/* Loading Overlay */}
      {loading && (
        <View style={StyleSheet.absoluteFillObject}>
          <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ backgroundColor: '#fff', padding: 20, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#fff'},
  floatingTop:{position:'absolute',top: Platform.OS === 'ios' ? 60 : 20,left:16,right:16,zIndex:10,gap:12},
  searchRow:{
    flexDirection:'row',alignItems:'center',backgroundColor:'rgba(255,255,255,0.95)',
    borderRadius:28,paddingHorizontal:16,paddingVertical:12,gap:12,
    shadowColor:'#000',shadowOffset:{width:0,height:8},shadowOpacity:0.1,shadowRadius:15,elevation:10
  },
  input:{flex:1,fontSize:15,color:'#111',fontWeight:'600'},
  chipBar:{maxHeight:44},
  chipScroll:{gap:8,paddingRight:40},
  chip:{
    flexDirection:'row',alignItems:'center',gap:6,backgroundColor:'rgba(255,255,255,0.9)',
    borderRadius:20,paddingHorizontal:14,paddingVertical:8,borderWidth:1,borderColor:'rgba(0,0,0,0.05)',
    shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.05,shadowRadius:8,elevation:3
  },
  chipOn:{backgroundColor:Colors.primary,borderColor:Colors.primary},
  chipTxt:{fontSize:13,fontWeight:'700',color:Colors.text},
  chipTxtOn:{color:'#fff'},
  chipReset:{
    backgroundColor:'#222',width:36,height:36,borderRadius:18,
    alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:0.2,shadowRadius:5
  },
  mapWrap:{flex:1,position:'relative'},
  leftControls:{position:'absolute',bottom:30,left:16,zIndex:5},
  rightControls:{position:'absolute',bottom:30,right:16,zIndex:5},
  glassBadge:{backgroundColor:'rgba(0,0,0,0.7)',paddingVertical:8,paddingHorizontal:14,borderRadius:20},
  glassBadgeTxt:{color:'#fff',fontSize:12,fontWeight:'800'},
  floatingBtn:{
    backgroundColor:'#fff',width:48,height:48,borderRadius:24,
    alignItems:'center',justifyContent:'center',
    shadowColor:'#000',shadowOffset:{width:0,height:4},shadowOpacity:0.15,shadowRadius:10,elevation:6
  },
  aiFab:{
    position:'absolute',top:140,right:16,backgroundColor:Colors.primary,
    flexDirection:'row',alignItems:'center',gap:8,paddingVertical:10,paddingHorizontal:16,
    borderRadius:25,shadowColor:Colors.primary,shadowOpacity:0.3,shadowRadius:10,elevation:8
  },
  aiFabTxt:{color:'#fff',fontSize:13,fontWeight:'900'},
  overlay:{flex:1,backgroundColor:'rgba(0,0,0,0.4)',justifyContent:'flex-end'},
  cardSheet:{backgroundColor:'#fff',borderTopLeftRadius:32,borderTopRightRadius:32,paddingBottom:20},
  handle:{width:40,height:5,borderRadius:3,backgroundColor:'#e0e0e0',alignSelf:'center',marginTop:12,marginBottom:8},
  cardContent:{padding:20,gap:20},
  cardImagePlaceholder:{
    width:'100%',height:180,backgroundColor:'#f8f9fa',borderRadius:24,
    alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden'
  },
  priceBadge:{position:'absolute',top:16,right:16,backgroundColor:Colors.primary,paddingVertical:6,paddingHorizontal:12,borderRadius:12},
  priceBadgeTxt:{color:'#fff',fontSize:15,fontWeight:'900'},
  cardInfo:{gap:12},
  cardMetaRow:{flexDirection:'row',alignItems:'center',gap:10},
  tag:{backgroundColor:'#f0f2f5',paddingVertical:4,paddingHorizontal:10,borderRadius:8},
  tagTxt:{fontSize:12,fontWeight:'800',color:Colors.textMuted},
  rating:{flexDirection:'row',alignItems:'center',gap:4,marginLeft:'auto'},
  ratingTxt:{fontSize:13,fontWeight:'800',color:Colors.text},
  cardTitle:{fontSize:20,fontWeight:'900',color:Colors.text},
  cardLoc:{fontSize:14,color:Colors.textMuted,flexDirection:'row',alignItems:'center'},
  mainBtn:{
    backgroundColor:Colors.primary,height:56,borderRadius:18,
    flexDirection:'row',alignItems:'center',justifyContent:'center',gap:10,marginTop:8
  },
  mainBtnTxt:{color:'#fff',fontSize:16,fontWeight:'800'},
  sheet:{backgroundColor:'#fff',borderTopLeftRadius:32,borderTopRightRadius:32,maxHeight:'70%'},
  sheetTitle:{fontSize:18,fontWeight:'900',color:Colors.text,padding:24,paddingBottom:12},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:18,paddingHorizontal:24},
  rowOn:{backgroundColor:Colors.primary + '08'},
  rowTxt:{fontSize:16,fontWeight:'600',color:Colors.text},
  rowTxtOn:{color:Colors.primary,fontWeight:'800'},
  sep:{height:1,backgroundColor:'#f4f5f7',marginHorizontal:24},
  empty:{textAlign:'center',color:'#aaa',fontSize:14,padding:40},
  fallback:{flex:1,backgroundColor:'#f8f9fa',alignItems:'center',justifyContent:'center',gap:16,padding:40},
  fallbackEmoji:{fontSize:64},
  fallbackTitle:{fontSize:20,fontWeight:'900',color:Colors.text},
  fallbackSub:{fontSize:14,color:Colors.textMuted,textAlign:'center'},
  fallbackCode:{backgroundColor:'#111',borderRadius:12,padding:16,marginTop:8},
  fallbackCodeTxt:{color:Colors.primary,fontFamily:Platform.OS==='ios'?'Courier':'monospace',fontSize:12},
});