import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  TextInput, ScrollView, Modal, FlatList, Platform, ActivityIndicator, Image, Pressable
} from 'react-native';
import { 
  Search, 
  ChevronDown, 
  RefreshCcw, 
  LocateFixed, 
  Plus, 
  Minus, 
  Sparkles, 
  MapPin, 
  Star, 
  Map as MapIcon,
  X,
  ArrowRight,
  SlidersHorizontal,
  Home as HomeIcon,
  DollarSign
} from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { ListingAPI, Listing as BackendListing, CategoryAPI, Category } from '../services/api';
import BottomNav, { TabName } from '../components/BottomNav';
import { cn } from '../utils/cn';
import { Badge } from '../components/ui/Badge';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAhcTN2Y9g3NpsaRus5Yc7rSvTsnhdE5FY';

interface Props { onNavigate: (tab: TabName, params?: any) => void; onOpenDetail?: (id: number) => void; params?: any; }
interface MapListing {
  id: number;
  title: string;
  price: string;
  lat: number;
  lng: number;
  district: string;
  committee: string;
  rooms: number;
  area: number;
  address?: string;
  imageUrl?: string;
  regionLabel?: string;
}
interface District { id: number | string; name: string; lat: number; lng: number; zoom: number; }

const UB = { lat: 47.9077, lng: 106.8832 };

const DISTRICTS: District[] = [
  { id: 9,  name:'Баянзүрх',       lat:47.920, lng:106.970, zoom:13 },
  { id: 8,  name:'Сүхбаатар',       lat:47.920, lng:106.845, zoom:13 },
  { id: 11, name:'Хан-Уул',          lat:47.860, lng:106.900, zoom:13 },
  { id: 12, name:'Баянгол',          lat:47.900, lng:106.820, zoom:13 },
  { id: 13, name:'Сонгинохайрхан',  lat:47.940, lng:106.750, zoom:12 },
  { id: 10, name:'Чингэлтэй',       lat:47.930, lng:106.870, zoom:13 },
  { id: 7,  name:'Улаанбаатар',     lat:47.907, lng:106.883, zoom:12 },
];

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
  background:#ffffff;color:#111;padding:8px 16px;border-radius:12px;
  font-size:13px;font-weight:900;border:1px solid rgba(0,0,0,0.05);
  box-shadow:0 4px 15px rgba(0,0,0,0.1);cursor:pointer;
  white-space:nowrap;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  transition:all 0.2s cubic-bezier(0.2, 0, 0, 1);
  display:flex;align-items:center;justify-content:center;
}
.pp:active{transform:scale(0.9)}
.pp.hot{background:#2e55fa;color:#fff;border-color:transparent;z-index:999 !important;box-shadow:0 8px 20px rgba(46,85,250,0.3);transform:scale(1.1)}
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
      {featureType:'landscape',elementType:'geometry',stylers:[{color:'#f5f5f5'}]},
      {featureType:'road',elementType:'geometry',stylers:[{color:'#ffffff'}]},
      {featureType:'water',elementType:'geometry',stylers:[{color:'#deebf4'}]}
    ]
  });
  map.addListener('zoom_changed',function(){notify({type:'zoom',zoom:map.getZoom()});});
  map.addListener('idle', function() {
    var b = map.getBounds();
    var ne = b.getNorthEast();
    var sw = b.getSouthWest();
    notify({
      type: 'bounds',
      min_lat: sw.lat(),
      max_lat: ne.lat(),
      min_lng: sw.lng(),
      max_lng: ne.lng()
    });
  });
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
          fillColor:hot?'#2e55fa':'#fff',fillOpacity:1,strokeColor:hot?'#fff':'#2e55fa',strokeWeight:2,scale:0.6,anchor:new google.maps.Point(0,0)
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

function WebMap({ html, iframeRef }: { html: string; iframeRef: React.MutableRefObject<any> }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [html]);
  if (!src) return null;
  return <iframe ref={iframeRef} src={src} style={{ width:'100%', height:'100%', border:'none' }} title="map" />;
}

export default function MapScreen({ onNavigate, onOpenDetail, params }: Props) {
  const mapRef = useRef<any>(null);
  const lastFetchId = useRef(0);
  const debounceTimer = useRef<any>(null);
  
  // States
  const [zoom, setZoom] = useState(12);
  const [query, setQuery] = useState(params?.search || '');
  const [districtModal, setDistrictModal] = useState(false);
  const [selDistrict, setSelDistrict] = useState<District | null>(null);
  const [selListing, setSelListing] = useState<MapListing | null>(null);
  const [listings, setListings] = useState<MapListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [bounds, setBounds] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Filter States
  const [selCategory, setSelCategory] = useState<number | null>(params?.category ? Number(params.category) : null);
  const [selRooms, setSelRooms] = useState<number | null>(params?.bedrooms ? Number(params.bedrooms) : null);
  const [priceRange, setPriceRange] = useState<{min?: string, max?: string}>(
    {min: params?.min_price, max: params?.max_price}
  );

  const isWeb = Platform.OS === 'web';

  // Load Categories on mount
  useEffect(() => {
    CategoryAPI.list().then(setCategories).catch(console.error);
  }, []);

  // Sync params if they change (e.g. returning from SearchFilterScreen)
  useEffect(() => {
    if (params) {
      if (params.search !== undefined) setQuery(params.search);
      if (params.category !== undefined) setSelCategory(params.category ? Number(params.category) : null);
      if (params.bedrooms !== undefined) setSelRooms(params.bedrooms ? Number(params.bedrooms) : null);
      if (params.min_price !== undefined || params.max_price !== undefined) {
        setPriceRange({ min: params.min_price, max: params.max_price });
      }
      if (params.region) {
        const found = DISTRICTS.find(d => String(d.id) === String(params.region));
        if (found) { setSelDistrict(found); panTo(found.lat, found.lng, found.zoom); }
      }
    }
  }, [params]);

  const fetchData = useCallback(async (currentBounds?: any) => {
    const fetchId = ++lastFetchId.current;
    setLoading(true);
    try {
      const apiParams: any = {
        search: query,
        region_id: selDistrict?.id || params?.region,
        category: selCategory,
        bedrooms: selRooms,
        min_price: priceRange.min,
        max_price: priceRange.max,
      };
      
      if (currentBounds) {
        apiParams.min_lat = currentBounds.min_lat;
        apiParams.max_lat = currentBounds.max_lat;
        apiParams.min_lng = currentBounds.min_lng;
        apiParams.max_lng = currentBounds.max_lng;
      }
      
      const res = await ListingAPI.list(apiParams);
      if (fetchId !== lastFetchId.current) return;
      
      const mapped = (res.results || []).map((l: BackendListing) => ({
        id: l.id,
        title: l.title,
        price: (l.price || 0).toLocaleString(),
        lat: Number(l.latitude) || UB.lat,
        lng: Number(l.longitude) || UB.lng,
        rooms: l.bedrooms ?? 0,
        area: Math.round(Number(l.area_sqm ?? 0)),
        address: l.address,
        imageUrl: l.cover_image ?? l.images?.[0]?.image_url,
        regionLabel: l.region_name,
      }));
      setListings(mapped);
      evalInMap(`window.updateListings && window.updateListings(${JSON.stringify(mapped)})`);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [query, selDistrict, selCategory, selRooms, priceRange]);

  // Sync effect for all logic-based filters
  useEffect(() => {
    fetchData(bounds);
  }, [selDistrict, query, selCategory, selRooms, priceRange]);

  // Debounced fetch on bounds change
  useEffect(() => {
    if (!bounds) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchData(bounds);
    }, 600);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [bounds, fetchData]);

  useEffect(() => {
    if (!isWeb) return;
    const handler = (e: MessageEvent) => {
      try { 
        const data = JSON.parse(typeof e.data === 'string' ? e.data : JSON.stringify(e.data));
        handleMsg(data);
      } catch {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const evalInMap = (js: string) => {
    if (isWeb) mapRef.current?.contentWindow?.eval(js);
    else mapRef.current?.injectJavaScript(js + '; true;');
  };

  const handleMsg = (d: any) => {
    if (!d) return;
    if (d.type === 'zoom') setZoom(d.zoom);
    if (d.type === 'click') setSelListing(d.listing);
    if (d.type === 'bounds') {
      setBounds({
        min_lat: d.min_lat,
        max_lat: d.max_lat,
        min_lng: d.min_lng,
        max_lng: d.max_lng
      });
    }
  };

  const panTo = (lat: number, lng: number, z: number) =>
    evalInMap(`window.goTo && window.goTo(${lat},${lng},${z})`);

  const pickDistrict = (d: District) => {
    setSelDistrict(d); setDistrictModal(false);
    panTo(d.lat, d.lng, d.zoom);
  };

  const renderMapView = () => {
    const html = buildMapHTML(listings, UB, zoom);
    if (isWeb) return <WebMap html={html} iframeRef={mapRef} />;
    try {
      const { WebView } = require('react-native-webview');
      return (
        <WebView
          ref={mapRef}
          source={{ html }}
          style={{ flex: 1 }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={(e: any) => { try { handleMsg(JSON.parse(e.nativeEvent.data)); } catch {} }}
        />
      );
    } catch {
      return <View className="flex-1 items-center justify-center bg-muted"><Text>Map requires Webview</Text></View>;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      {/* Floating Header */}
      <View className="absolute top-4 left-5 right-5 z-20 gap-3">
        <View className="flex-row gap-2">
          <View className="flex-1 bg-white/95 border border-border rounded-3xl p-2 px-4 flex-row items-center shadow-lg shadow-black/10">
            <Search size={20} className="text-muted-foreground" />
            <TextInput
              className="flex-1 h-12 ml-3 text-sm font-bold text-foreground"
              placeholder="Хаана байр хайж байна?"
              value={query}
              onChangeText={setQuery}
            />
            {query !== '' && <TouchableOpacity onPress={() => setQuery('')}><X size={18} className="text-muted-foreground mr-2" /></TouchableOpacity>}
          </View>
          <TouchableOpacity 
            onPress={() => onNavigate('search_filter')}
            className="w-16 h-16 bg-slate-900 rounded-3xl items-center justify-center shadow-lg shadow-black/20"
          >
            <SlidersHorizontal size={24} color="white" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pr-5">
          <TouchableOpacity 
            onPress={() => setDistrictModal(true)}
            className={cn(
              "flex-row items-center gap-2 bg-white/95 border px-4 py-2.5 rounded-2xl shadow-sm",
              selDistrict ? "border-primary bg-primary/5" : "border-border"
            )}
          >
            <MapPin size={14} className={selDistrict ? "text-primary" : "text-muted-foreground"} />
            <Text className={cn("text-xs font-black", selDistrict ? "text-primary" : "text-foreground")}>
              {selDistrict?.name ?? 'Бүх дүүрэг'}
            </Text>
            <ChevronDown size={14} className={selDistrict ? "text-primary" : "text-muted-foreground"} />
          </TouchableOpacity>

          <TouchableOpacity 
             onPress={() => setSelRooms(selRooms === 1 ? null : 1)}
             className={cn(
               "flex-row items-center gap-2 bg-white/95 border px-4 py-2.5 rounded-2xl shadow-sm",
               selRooms === 1 ? "border-primary bg-primary/5" : "border-border"
             )}
          >
            <Text className={cn("text-xs font-black", selRooms === 1 ? "text-primary" : "text-foreground")}>1 өрөө</Text>
          </TouchableOpacity>

          <TouchableOpacity 
             onPress={() => setSelRooms(selRooms === 2 ? null : 2)}
             className={cn(
               "flex-row items-center gap-2 bg-white/95 border px-4 py-2.5 rounded-2xl shadow-sm",
               selRooms === 2 ? "border-primary bg-primary/5" : "border-border"
             )}
          >
            <Text className={cn("text-xs font-black", selRooms === 2 ? "text-primary" : "text-foreground")}>2 өрөө</Text>
          </TouchableOpacity>

          <TouchableOpacity 
             onPress={() => setSelRooms(selRooms === 3 ? null : 3)}
             className={cn(
               "flex-row items-center gap-2 bg-white/95 border px-4 py-2.5 rounded-2xl shadow-sm",
               selRooms === 3 ? "border-primary bg-primary/5" : "border-border"
             )}
          >
            <Text className={cn("text-xs font-black", selRooms === 3 ? "text-primary" : "text-foreground")}>3+ өрөө</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => fetchData(bounds)}
            className="w-10 h-10 bg-white/95 border border-border rounded-xl items-center justify-center shadow-sm"
          >
            <RefreshCcw size={16} className="text-foreground" />
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View className="flex-1 relative">
        {renderMapView()}

        {/* Floating Controls */}
        <View className="absolute bottom-28 right-5 gap-3">
          <TouchableOpacity 
            className="w-12 h-12 bg-white rounded-2xl items-center justify-center border border-border shadow-lg"
            onPress={() => panTo(UB.lat, UB.lng, 12)}
          >
            <LocateFixed size={24} className="text-primary" />
          </TouchableOpacity>
          <View className="bg-white rounded-2xl border border-border shadow-lg">
            <TouchableOpacity className="w-12 h-12 items-center justify-center border-b border-border" onPress={() => evalInMap('map.setZoom(map.getZoom()+1)')}>
              <Plus size={20} className="text-foreground" />
            </TouchableOpacity>
            <TouchableOpacity className="w-12 h-12 items-center justify-center" onPress={() => evalInMap('map.setZoom(map.getZoom()-1)')}>
              <Minus size={20} className="text-foreground" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Indicator */}
        <View className="absolute bottom-28 left-5">
           <View className="bg-slate-900 px-4 py-2 rounded-full flex-row items-center gap-2">
             <Sparkles size={14} className="text-primary" />
             <Text className="text-white text-[11px] font-black">{listings.length} байр олдлоо</Text>
           </View>
        </View>
      </View>

      {/* Property Slide-up Sheet */}
      <Modal visible={!!selListing} transparent animationType="slide">
        <Pressable className="flex-1 bg-black/10 justify-end" onPress={() => setSelListing(null)}>
          <Pressable onPress={e => e.stopPropagation()}>
            <View className="bg-card border-t border-border rounded-t-[40px] p-6 pb-12 shadow-2xl">
              <View className="w-12 h-1.5 bg-muted rounded-full self-center mb-6" />
            
            {selListing && (
              <TouchableOpacity onPress={() => { setSelListing(null); onOpenDetail?.(selListing.id); }}>
                <View className="flex-row items-center gap-5">
                  <Image source={{ uri: selListing.imageUrl }} className="w-32 h-32 rounded-[28px] bg-muted" />
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-xl font-black text-foreground tracking-tight">{selListing.price} ₮</Text>
                      <View className="bg-primary/10 px-2 py-0.5 rounded-lg">
                        <Text className="text-[10px] font-black text-primary">Сул</Text>
                      </View>
                    </View>
                    <Text className="text-sm font-bold text-foreground mb-1" numberOfLines={1}>{selListing.title}</Text>
                    <View className="flex-row items-center gap-3">
                       <View className="flex-row items-center gap-1">
                         <MapPin size={12} className="text-muted-foreground" />
                         <Text className="text-[10px] font-bold text-muted-foreground">{selListing.regionLabel}</Text>
                       </View>
                       <View className="flex-row items-center gap-1">
                         <Star size={12} fill="#f59e0b" color="#f59e0b" />
                         <Text className="text-[10px] font-bold text-foreground">4.8</Text>
                       </View>
                    </View>
                    
                    <View className="flex-row gap-3 mt-4">
                       <Badge label={`${selListing.rooms} өрөө`} variant="secondary" />
                       <Badge label={`${selListing.area} м²`} variant="secondary" />
                    </View>
                  </View>
                </View>
                
                <View className="mt-8 bg-primary h-14 rounded-2xl flex-row items-center justify-center gap-2">
                   <Text className="text-white font-black">Дэлгэрэнгүй харах</Text>
                   <ArrowRight size={18} color="white" />
                </View>
              </TouchableOpacity>
            )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* District Picker */}
      <Modal visible={districtModal} transparent animationType="fade">
        <TouchableOpacity className="flex-1 bg-black/40 justify-center px-10" onPress={() => setDistrictModal(false)}>
           <View className="bg-card rounded-[32px] overflow-hidden max-h-[60%]">
              <View className="p-6 border-b border-border flex-row justify-between items-center bg-secondary/50">
                <Text className="text-lg font-black text-foreground uppercase tracking-widest">Дүүрэг сонгох</Text>
                <X size={20} className="text-muted-foreground" />
              </View>
              <FlatList
                data={DISTRICTS}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    onPress={() => pickDistrict(item)}
                    className="p-5 border-b border-border/50 flex-row justify-between items-center"
                  >
                    <Text className={cn("text-base font-bold", selDistrict?.id === item.id ? "text-primary" : "text-foreground")}>
                      {item.name}
                    </Text>
                    {selDistrict?.id === item.id && <View className="w-2 h-2 rounded-full bg-primary" />}
                  </TouchableOpacity>
                )}
              />
           </View>
        </TouchableOpacity>
      </Modal>

      <BottomNav active="map" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}