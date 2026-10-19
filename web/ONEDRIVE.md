# إعداد OneDrive لبرنامج Tibyan

الحالة الحالية: مسار الربط مضاف، لكن معرّف تطبيق Microsoft لم يُضبط. لا يظهر نجاح الحفظ إلا بعد نجاح طلب رفع الملف إلى Microsoft Graph.

## إعداد المالك مرة واحدة

1. من [Microsoft Entra](https://entra.microsoft.com/) افتح App registrations ثم New registration، وسم التطبيق **Tibyan**. اختر دعم الحسابات التنظيمية والحسابات الشخصية إذا كانت سياسة حسابك تسمح بذلك.
2. أضف منصة **Single-page application (SPA)** مع رابط العودة `https://app-5dr52f.v2.appdeploy.ai/`. للتطوير يمكن تسجيل `http://localhost:5173/` كذلك. يجب أن يطابق الرابط المسجل رابط العودة المعروض داخل شاشة الربط حرفيًا.
3. أضف صلاحية Microsoft Graph من نوع **Delegated** باسم `Files.ReadWrite.AppFolder`. لا تضف صلاحيات قراءة كامل القرص، ولا تنشئ Client Secret لتطبيق المتصفح.
4. انسخ **Application (client) ID** العام إلى `src/cloud-config.js` وأعد البناء والنشر. يمكن إدخاله مؤقتًا من تفاصيل إعداد الربط داخل الواجهة على جهاز المالك.
5. من Tibyan اضغط **ربط حساب Microsoft**، واختر الحساب المقصود وسجّل الدخول على صفحة Microsoft. وافق على مجلد التطبيق. سيُنشأ `Apps/Tibyan` عند أول استخدام إذا كان اسم التسجيل Tibyan.

حسابات العمل أو المدرسة قد تتطلب موافقة مسؤول المؤسسة. لا يكفي تثبيت إضافة SharePoint في ChatGPT لمنح التطبيق المنشور صلاحية الوصول إلى OneDrive.

## السلوك

- مكتبة Microsoft MSAL مضمّنة في الحزمة؛ لا تحميل من CDN. رموز الدخول في sessionStorage وبصلاحية مجلد التطبيق فقط.
- البيانات المحلية هي نسخة العمل؛ تُرفع نسخة تلقائيًا بعد التغيير عندما تكون الصفحة مفتوحة والإنترنت والجلسة متاحين.
- لكل جهاز ملف `Tibyan-{device-id}.json`. الملفات لا تحتوي كلمات مرور أو رموز دخول أو ملفات تثبيت.
- لا تُستبدل بيانات جهاز آخر تلقائيًا. لاستكمال العمل على جهاز ثانٍ، سجّل الدخول واختر النسخة المطلوبة من **النسخ المحفوظة في OneDrive** ثم وافق على الاستعادة.
- قد يطلب Microsoft تجديد تسجيل الدخول. تظهر حالة الفشل وتظل البيانات المحلية متاحة. زر **حفظ الآن / إعادة المحاولة** يعيد الرفع.
- فصل الربط يوقف الرفع ويمسح جلسة هذا التطبيق؛ لا يحذف ملفات OneDrive ولا يسجّل خروجك من جميع خدمات Microsoft.
- مسح البيانات المحلية يوقف الحفظ التلقائي ولا يحذف النسخ الموجودة في OneDrive.
- الملفات محمية بصلاحيات حساب OneDrive؛ لا تُنشأ روابط مشاركة عامة.

## المراجع الرسمية

- [Microsoft Graph app folder](https://learn.microsoft.com/en-us/graph/onedrive-sharepoint-appfolder)
- [MSAL initialization and redirect handling](https://learn.microsoft.com/en-us/entra/identity-platform/msal-js-initializing-client-applications)
- [Authorization code flow and SPA refresh lifetime](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow)
