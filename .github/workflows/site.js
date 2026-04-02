(function(){
  const SB_URL = 'https://rzatstugypyqmqlqynlx.supabase.co';
  const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6YXRzdHVneXB5cW1xbHF5bmx4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTM2OTQsImV4cCI6MjA5MDQyOTY5NH0.nlbFlgGxETk_kGEc2K0JhjQ2ocq9Fh4sOnLVtL_emgs';

  const PATHS = {
    home: '/',
    search: '/search',
    universities: '/universities',
    compare: '/compare',
    timeline: '/timeline',
    university: '/university',
    ogImage: '/og-image.png',
    data: 'mytcas_data.json',
  };

  function getCurrentTcasYear(date = new Date()) {
    const month = date.getMonth() + 1;
    const beYear = date.getFullYear() + 543;
    return month >= 12 ? beYear + 1 : beYear;
  }

  function getCurrentTcasNum(date = new Date()) {
    return getCurrentTcasYear(date) - 2500;
  }

  function applyYearTokens(root = document) {
    const tcasYear = getCurrentTcasYear();
    const tcasNum = tcasYear - 2500;
    root.querySelectorAll('[data-tcas-year]').forEach((el) => {
      el.textContent = 'TCAS' + tcasNum;
    });
    root.querySelectorAll('[data-tcas-num]').forEach((el) => {
      el.textContent = String(tcasNum);
    });
    root.querySelectorAll('[data-tcas-beyear]').forEach((el) => {
      el.textContent = String(tcasYear);
    });
    window.tcasYear = tcasYear;
    window.tcasNum = tcasNum;
  }

  function normalizeType(t) {
    if (!t) return '';
    if (String(t).includes('ราชภัฏ')) return 'ราชภัฏ';
    if (String(t).includes('ราชมงคล')) return 'ราชมงคล';
    if (String(t).includes('เอกชน') || t === 'Private') return 'เอกชน';
    if (String(t).includes('รัฐบาล') || t === 'Public' || t === 'Government') return 'รัฐบาล';
    return String(t);
  }

  function getEmoji(n) {
    const name = String(n || '');
    const map = {
      'จุฬา':'🏛️','ธรรมศาสตร์':'🔴','มหิดล':'💙','เกษตร':'🌾','พระจอมเกล้าธนบุรี':'🔧','ลาดกระบัง':'⚡','พระนครเหนือ':'🏗️',
      'ศรีนครินทรวิโรฒ':'🎓','ศิลปากร':'🎨','บูรพา':'🌊','เชียงใหม่':'🌸','นเรศวร':'⚔️','แม่ฟ้าหลวง':'🍃','แม่โจ้':'🌱',
      'พะเยา':'🏔️','ขอนแก่น':'🌻','มหาสารคาม':'🐘','อุบลราชธานี':'🌿','นครพนม':'🦚','สงขลา':'🏝️','วลัยลักษณ์':'🌴',
      'ทักษิณ':'🎏','ราชภัฏ':'📚','ราชมงคล':'🔩','รังสิต':'🌟','กรุงเทพ':'🏙️'
    };
    for (const [key, value] of Object.entries(map)) {
      if (name.includes(key)) return value;
    }
    return '🎓';
  }

  function mapLocalData(data) {
    return (Array.isArray(data) ? data : []).map((u) => ({
      id: u.id,
      code: u.code || '',
      name_th: u.name_th || '',
      name_en: u.name_en || '',
      uni_type: normalizeType(u.uni_type || ''),
      location: u.location || '',
      region: u.region || '',
      website: u.website || '',
      emoji: u.emoji || getEmoji(u.name_th || ''),
      source_url: u.source_url || '',
      faculties: (u.faculties || []).map((f) => ({
        id: f.id,
        uni_id: f.uni_id || u.id,
        name_th: f.name_th || '',
        name_en: f.name_en || '',
        category: f.category || 'อื่นๆ',
        tuition: f.tuition_per_year ?? null,
        tuition_per_year: f.tuition_per_year ?? null,
        degree_level: f.degree_level || 'ปริญญาตรี',
        r1: Number(f.r1 || 0),
        r2: Number(f.r2 || 0),
        r3: Number(f.r3 || 0),
        r4: Number(f.r4 || 0),
        r5: Number(f.r5 || 0),
        min_score: f.min_score == null ? null : Number(f.min_score),
        criteria: f.criteria || '',
        history: Array.isArray(f.history) ? f.history : [],
        source_url: f.source_url || u.source_url || '',
      })),
    }));
  }

  async function fetchJson(url, options = {}, timeoutMs = 12000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error('timeout')), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  async function fetchAdmissions({ year, yearGte, uniId, select, limit = 9999 } = {}) {
    const params = [];
    if (year != null) params.push(`year=eq.${encodeURIComponent(year)}`);
    if (yearGte != null) params.push(`year=gte.${encodeURIComponent(yearGte)}`);
    if (uniId) params.push(`uni_id=eq.${encodeURIComponent(uniId)}`);
    if (select) params.push(`select=${encodeURIComponent(select)}`);
    if (limit != null) params.push(`limit=${encodeURIComponent(limit)}`);
    const qs = params.join('&');
    const url = `${SB_URL}/rest/v1/v_admission_full${qs ? '?' + qs : ''}`;
    return fetchJson(url, { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }, 12000);
  }

  async function fetchLocalData() {
    return mapLocalData(await fetchJson(PATHS.data, {}, 12000));
  }

  document.addEventListener('DOMContentLoaded', () => applyYearTokens(document));

  window.SiteConfig = {
    SB_URL,
    SB_KEY,
    PATHS,
    tcasYear: getCurrentTcasYear,
    tcasNum: getCurrentTcasNum,
    applyYearTokens,
    normalizeType,
    getEmoji,
    mapLocalData,
    fetchJson,
    fetchAdmissions,
    fetchLocalData,
  };
})();