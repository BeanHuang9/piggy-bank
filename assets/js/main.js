const { createApp, ref, computed, nextTick, onMounted } = Vue;

createApp({
  setup() {
    // ===== 狀態 =====
    const savings = ref(JSON.parse(localStorage.getItem('beanSavingsVue')) || {});
    const viewDate = ref(new Date());
    const showModal = ref(false);
    const inputAmount = ref(null);
    const selectedDateKey = ref('');
    const amountInput = ref(null);

    // ===== 計算 =====
    const viewYear = computed(() => viewDate.value.getFullYear());
    const viewMonth = computed(() => viewDate.value.getMonth());

    const firstDayIndex = computed(() => new Date(viewYear.value, viewMonth.value, 1).getDay());

    const daysInMonth = computed(() => new Date(viewYear.value, viewMonth.value + 1, 0).getDate());

    const isTodayMonth = computed(() => {
      const now = new Date();
      return viewYear.value === now.getFullYear() && viewMonth.value === now.getMonth();
    });

    const totalSavings = computed(() =>
      Object.values(savings.value).reduce((sum, val) => sum + (Number(val) || 0), 0)
    );

    const currentMonthDays = computed(() => {
      const prefix = `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}`;
      return Object.keys(savings.value).filter((key) => key.startsWith(prefix)).length;
    });

    // ===== 工具 =====
    const getDateKey = (day) =>
      `${viewYear.value}-${String(viewMonth.value + 1).padStart(2, '0')}-${String(day).padStart(
        2,
        '0'
      )}`;

    const isToday = (day) => {
      const today = new Date();
      const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`;
      return getDateKey(day) === key;
    };

    const hasSaved = (day) => !!savings.value[getDateKey(day)];

    // ===== 操作 =====
    const changeMonth = (step) => {
      const d = new Date(viewDate.value);
      d.setMonth(d.getMonth() + step, 1);
      viewDate.value = d;
    };

    const goToday = () => {
      viewDate.value = new Date();
    };

    const openModal = (day) => {
      selectedDateKey.value = getDateKey(day);
      inputAmount.value = savings.value[selectedDateKey.value] || null;
      showModal.value = true;

      nextTick(() => {
        amountInput.value?.focus();
      });
    };

    const saveData = async () => {
      if (!inputAmount.value || inputAmount.value <= 0) {
        delete savings.value[selectedDateKey.value];
        localStorage.setItem('beanSavingsVue', JSON.stringify(savings.value));
        showModal.value = false;
        return;
      }

      savings.value[selectedDateKey.value] = inputAmount.value;
      localStorage.setItem('beanSavingsVue', JSON.stringify(savings.value));

      try {
        await fetch(
          'https://script.google.com/macros/s/AKfycbwkDoqH8h5GpAeKLYF-izvl8s9qNQjQL93EVLXhy7iCFTT2qU3WURYtiJXOE63cJLPKFg/exec',
          {
            method: 'POST',
            body: JSON.stringify({
              date: selectedDateKey.value,
              amount: inputAmount.value,
            }),
          }
        );
      } catch (err) {
        console.error('寫入 Google Sheet 失敗', err);
      }

      showModal.value = false;
    };

    // ⭐ 頁面載入時，從 Sheet 抓資料（關鍵）
    onMounted(async () => {
      try {
        const res = await fetch(
          'https://script.google.com/macros/s/AKfycbwkDoqH8h5GpAeKLYF-izvl8s9qNQjQL93EVLXhy7iCFTT2qU3WURYtiJXOE63cJLPKFg/exec'
        );
        const sheetData = await res.json();

        savings.value = sheetData;
        localStorage.setItem('beanSavingsVue', JSON.stringify(sheetData));
      } catch (err) {
        console.error('讀取 Google Sheet 失敗', err);
      }
    });

    return {
      savings,
      viewYear,
      viewMonth,
      firstDayIndex,
      daysInMonth,
      isTodayMonth,
      totalSavings,
      currentMonthDays,
      showModal,
      inputAmount,
      selectedDateKey,
      amountInput,
      getDateKey,
      isToday,
      hasSaved,
      changeMonth,
      goToday,
      openModal,
      saveData,
    };
  },
}).mount('#app');
