// Food item icon mapping for better visual representation
export const getFoodIcon = (foodName: string): string => {
  const name = foodName.toLowerCase();
  
  // 肉類
  if (name.includes('牛') || name.includes('ビーフ') || name.includes('beef')) {
    return '🥩';
  }
  if (name.includes('豚') || name.includes('ポーク') || name.includes('pork')) {
    return '🥓';
  }
  if (name.includes('鶏') || name.includes('チキン') || name.includes('chicken')) {
    return '🍗';
  }
  if (name.includes('ミンチ') || name.includes('挽肉') || name.includes('ひき肉')) {
    return '🥩';
  }
  
  // 野菜
  if (name.includes('トマト') || name.includes('tomato')) {
    return '🍅';
  }
  if (name.includes('にんじん') || name.includes('人参') || name.includes('carrot')) {
    return '🥕';
  }
  if (name.includes('玉ねぎ') || name.includes('たまねぎ') || name.includes('onion')) {
    return '🧅';
  }
  if (name.includes('じゃがいも') || name.includes('ジャガイモ') || name.includes('potato')) {
    return '🥔';
  }
  if (name.includes('キャベツ') || name.includes('cabbage')) {
    return '🥬';
  }
  if (name.includes('レタス') || name.includes('lettuce')) {
    return '🥬';
  }
  if (name.includes('きゅうり') || name.includes('cucumber')) {
    return '🥒';
  }
  if (name.includes('ピーマン') || name.includes('pepper')) {
    return '🫑';
  }
  if (name.includes('なす') || name.includes('茄子') || name.includes('eggplant')) {
    return '🍆';
  }
  if (name.includes('大根') || name.includes('radish')) {
    return '🥕';
  }
  if (name.includes('小松菜') || name.includes('ほうれん草') || name.includes('spinach')) {
    return '🥬';
  }
  
  // 果物
  if (name.includes('りんご') || name.includes('apple')) {
    return '🍎';
  }
  if (name.includes('バナナ') || name.includes('banana')) {
    return '🍌';
  }
  if (name.includes('みかん') || name.includes('orange')) {
    return '🍊';
  }
  if (name.includes('いちご') || name.includes('strawberry')) {
    return '🍓';
  }
  
  // 魚類
  if (name.includes('魚') || name.includes('さけ') || name.includes('鮭') || name.includes('fish') || name.includes('salmon')) {
    return '🐟';
  }
  if (name.includes('まぐろ') || name.includes('tuna')) {
    return '🐟';
  }
  
  // 大豆製品
  if (name.includes('豆腐') || name.includes('tofu')) {
    return '⬜';
  }
  if (name.includes('豆乳') || name.includes('soy milk')) {
    return '🥛';
  }
  if (name.includes('油揚げ') || name.includes('厚揚げ') || name.includes('fried tofu')) {
    return '🟨';
  }
  if (name.includes('納豆') || name.includes('natto')) {
    return '🫘';
  }
  if (name.includes('味噌') || name.includes('miso')) {
    return '🟤';
  }
  
  // 卵・乳製品
  if (name.includes('卵') || name.includes('たまご') || name.includes('egg')) {
    return '🥚';
  }
  if (name.includes('牛乳') || name.includes('ミルク') || name.includes('milk')) {
    return '🥛';
  }
  if (name.includes('チーズ') || name.includes('cheese')) {
    return '🧀';
  }
  
  // パン・米
  if (name.includes('パン') || name.includes('bread')) {
    return '🍞';
  }
  if (name.includes('米') || name.includes('ご飯') || name.includes('rice')) {
    return '🍚';
  }
  
  // 調味料・油
  if (name.includes('油') || name.includes('オイル') || name.includes('oil')) {
    return '🛢️';
  }
  if (name.includes('醤油') || name.includes('soy sauce')) {
    return '🍶';
  }
  if (name.includes('塩') || name.includes('salt')) {
    return '🧂';
  }
  
  // 豆腐・大豆製品
  if (name.includes('豆腐') || name.includes('tofu')) {
    return '🥛';
  }
  if (name.includes('油あげ') || name.includes('油揚げ') || name.includes('abura-age')) {
    return '🟡';
  }
  
  // その他
  if (name.includes('麺') || name.includes('noodle') || name.includes('pasta')) {
    return '🍜';
  }
  
  // デフォルト
  return '🥘';
};

export const getFoodCategory = (foodName: string): string => {
  const name = foodName.toLowerCase();
  
  if (name.includes('牛') || name.includes('豚') || name.includes('鶏') || 
      name.includes('ミンチ') || name.includes('挽肉') || name.includes('肉')) {
    return 'チルド';
  }
  
  if (name.includes('魚') || name.includes('さけ') || name.includes('鮭') || 
      name.includes('まぐろ') || name.includes('fish')) {
    return 'チルド';
  }
  
  if (name.includes('トマト') || name.includes('にんじん') || name.includes('玉ねぎ') ||
      name.includes('キャベツ') || name.includes('レタス') || name.includes('きゅうり') ||
      name.includes('ピーマン') || name.includes('なす') || name.includes('大根') ||
      name.includes('小松菜') || name.includes('ほうれん草')) {
    return '野菜室';
  }
  
  if (name.includes('豆腐') || name.includes('豆乳') || name.includes('油揚げ') ||
      name.includes('厚揚げ') || name.includes('納豆') || name.includes('味噌')) {
    return 'チルド';
  }
  
  if (name.includes('牛乳') || name.includes('ミルク') || name.includes('チーズ') ||
      name.includes('卵') || name.includes('たまご')) {
    return 'チルド';
  }
  
  if (name.includes('冷凍') || name.includes('アイス')) {
    return '冷凍庫';
  }
  
  return '冷蔵';
};