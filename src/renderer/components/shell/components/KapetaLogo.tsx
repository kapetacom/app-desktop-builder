import React from 'react';

export const Logo = (props: { width: number } = { width: 119 }) => {
    const ratio = 28 / 119;
    return (
        <svg
            width={props.width}
            height={props.width * ratio}
            viewBox="0 0 102 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M23 6.65852V17.2354C23 18.3118 22.3321 19.2718 21.3288 19.6512L12.9172 22.8324C12.3262 23.0559 11.6738 23.0559 11.0828 22.8324L2.67122 19.6512C1.6679 19.2718 1 18.3118 1 17.2354V6.65852C1 5.57159 1.68083 4.60466 2.69812 4.23276L11.1097 1.15761C11.6846 0.947463 12.3154 0.947463 12.8903 1.15761L21.3019 4.23276C22.3192 4.60466 23 5.57159 23 6.65852ZM3.16827 5.51881C2.68832 5.69427 2.36929 6.14935 2.36929 6.65852V17.2354C2.36929 17.7397 2.68225 18.1914 3.15559 18.3704L11.5672 21.5516C11.846 21.6571 12.154 21.6571 12.4328 21.5516L20.8444 18.3704C21.3177 18.1914 21.6307 17.7397 21.6307 17.2354V6.65852C21.6307 6.14935 21.3117 5.69427 20.8317 5.51881L12.4201 2.44366C12.1489 2.34451 11.8511 2.34451 11.5799 2.44366L3.16827 5.51881Z"
                fill="currentColor"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M17.5046 14.2397C18.1406 13.9924 19.2572 13.0178 19.2572 12.2886C19.2572 10.4281 15.4156 7.0249 12.0259 7.0249C8.63627 7.0249 5.00807 10.0867 4.66223 12.1978C4.50279 13.1711 6.16047 14.1036 6.45542 14.2397C6.94467 12.6955 9.22741 11.8712 10.2329 11.7308C10.2329 11.7308 10.7991 12.4374 12.0808 12.4781C12.8028 12.4781 13.5528 11.8848 13.6797 11.7308C15.6725 12.2839 17.3046 12.9631 17.5046 14.2397ZM11.9584 11.5098C12.8682 11.5098 13.6057 10.6919 13.6057 9.68287C13.6057 8.67387 12.8682 7.85592 11.9584 7.85592C11.0487 7.85592 10.3112 8.67387 10.3112 9.68287C10.3112 10.6919 11.0487 11.5098 11.9584 11.5098Z"
                fill="currentColor"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M17.5851 14.3853C17.5847 14.4087 17.5834 14.432 17.5812 14.4552C17.6011 14.5825 17.6002 14.7171 17.5769 14.8595C17.5555 16.0817 15.0314 17.0287 11.9391 16.9747C8.84679 16.9207 6.35726 15.8862 6.3786 14.6641C6.3734 14.4555 6.39616 14.2669 6.44456 14.0964C6.58968 12.9209 9.01363 12.0221 12.0246 12.0747C15.1169 12.1287 17.6064 13.1632 17.5851 14.3853ZM12.0029 16.0804C14.9353 16.1316 17.1687 15.1337 17.1465 14.6149C17.1186 13.9626 14.9929 12.8335 12.0605 12.7823C9.12815 12.7311 7.02491 13.9894 7.02491 14.4647C7.02491 14.8566 7.85187 16.0079 12.0029 16.0804Z"
                fill="currentColor"
            />
            <path
                d="M52.1363 18.67H43.4991C43.0774 18.67 42.6837 18.5896 42.3182 18.4289C41.9527 18.2682 41.6322 18.0502 41.3567 17.7747C41.0811 17.4935 40.8646 17.1664 40.7072 16.7934C40.5497 16.4147 40.471 16.0129 40.471 15.5883C40.471 15.1579 40.5497 14.7562 40.7072 14.3832C40.8646 14.0101 41.0811 13.683 41.3567 13.4018C41.6322 13.1206 41.9527 12.8997 42.3182 12.739C42.6837 12.5783 43.0774 12.498 43.4991 12.498H49.5384V14.2626H43.4991C43.3192 14.2626 43.1505 14.2999 42.993 14.3745C42.8356 14.4434 42.6978 14.5381 42.5797 14.6586C42.4616 14.7791 42.3688 14.9197 42.3014 15.0804C42.2339 15.2411 42.2001 15.4104 42.2001 15.5883C42.2001 15.7719 42.2339 15.9441 42.3014 16.1048C42.3688 16.2597 42.4616 16.3974 42.5797 16.5179C42.6978 16.6385 42.8356 16.7331 42.993 16.802C43.1505 16.8709 43.3192 16.9053 43.4991 16.9053H50.4072V12.059C50.4072 11.8811 50.3706 11.7118 50.2975 11.5511C50.2301 11.3904 50.1373 11.2498 50.0192 11.1293C49.9011 11.0088 49.7633 10.9141 49.6059 10.8453C49.4484 10.7707 49.2826 10.7334 49.1082 10.7334H42.2001V8.97731H49.1082C49.53 8.97731 49.9236 9.05765 50.2891 9.21834C50.6546 9.37902 50.9751 9.59996 51.2507 9.88116C51.5262 10.1566 51.7427 10.4808 51.9001 10.8539C52.0576 11.2269 52.1363 11.6286 52.1363 12.059V18.67Z"
                fill="currentColor"
            />
            <path
                d="M65.0689 13.8236C65.0689 14.4893 64.9452 15.1177 64.6977 15.7088C64.4503 16.2941 64.1129 16.8078 63.6856 17.2496C63.2582 17.6858 62.7577 18.033 62.1842 18.2912C61.6106 18.5437 60.9977 18.67 60.3454 18.67H56.4654V16.9053H60.3454C60.7615 16.8996 61.1495 16.8164 61.5094 16.6557C61.8749 16.4893 62.1926 16.2683 62.4625 15.9929C62.7324 15.7117 62.9461 15.3874 63.1036 15.0202C63.261 14.6471 63.3397 14.2483 63.3397 13.8236C63.3397 13.399 63.261 13.0001 63.1036 12.6271C62.9461 12.2484 62.7324 11.9213 62.4625 11.6458C62.1926 11.3646 61.8749 11.1437 61.5094 10.983C61.1495 10.8166 60.7615 10.7334 60.3454 10.7334H55.5966V21.7462H53.8675V8.97731H60.3454C60.9977 8.98305 61.6106 9.11504 62.1842 9.37328C62.7577 9.62578 63.2582 9.97297 63.6856 10.4149C64.1129 10.851 64.4503 11.3617 64.6977 11.9471C64.9452 12.5324 65.0689 13.1579 65.0689 13.8236Z"
                fill="currentColor"
            />
            <path
                d="M77.7765 12.059C77.7765 12.4894 77.6978 12.8911 77.5404 13.2641C77.3829 13.6371 77.1664 13.9642 76.8909 14.2454C76.621 14.5209 76.3005 14.739 75.9293 14.8996C75.5638 15.0603 75.173 15.1407 74.7569 15.1407H68.1356C68.2593 15.3989 68.4139 15.6371 68.5995 15.8551C68.7851 16.0732 68.9931 16.2597 69.2237 16.4147C69.4542 16.5696 69.7044 16.6901 69.9744 16.7762C70.2499 16.8623 70.5367 16.9053 70.8347 16.9053H76.486V18.67H70.8347C70.1824 18.6642 69.5695 18.5351 68.9959 18.2826C68.4224 18.0244 67.9219 17.6772 67.4945 17.241C67.0728 16.7991 66.7382 16.2855 66.4908 15.7002C66.2434 15.1148 66.1197 14.4893 66.1197 13.8236C66.1197 13.1579 66.2434 12.5324 66.4908 11.9471C66.7382 11.3617 67.0728 10.851 67.4945 10.4149C67.9219 9.97297 68.4224 9.62578 68.9959 9.37328C69.5695 9.11504 70.1824 8.98305 70.8347 8.97731H74.7569C75.173 8.97731 75.5638 9.05765 75.9293 9.21834C76.3005 9.37902 76.621 9.59996 76.8909 9.88116C77.1664 10.1566 77.3829 10.4808 77.5404 10.8539C77.6978 11.2269 77.7765 11.6286 77.7765 12.059ZM74.7569 13.3846C74.9312 13.3846 75.0971 13.3502 75.2545 13.2813C75.412 13.2125 75.5498 13.1178 75.6678 12.9973C75.7859 12.8767 75.8787 12.7362 75.9462 12.5755C76.0137 12.4148 76.0474 12.2426 76.0474 12.059C76.0474 11.8811 76.0137 11.7118 75.9462 11.5511C75.8787 11.3904 75.7859 11.2498 75.6678 11.1293C75.5498 11.0088 75.412 10.9141 75.2545 10.8453C75.0971 10.7707 74.9312 10.7334 74.7569 10.7334H70.8347C70.4523 10.7334 70.0924 10.8022 69.7551 10.9399C69.4233 11.0777 69.1253 11.267 68.861 11.5081C68.6023 11.7434 68.3858 12.0246 68.2115 12.3517C68.0428 12.673 67.9331 13.0173 67.8825 13.3846H74.7569Z"
                fill="currentColor"
            />
            <path
                d="M82.8121 18.67H81.083V10.7334H78.4935V8.97731H81.083V5.44802H82.8121V8.97731H88.8599V10.7334H82.8121V18.67Z"
                fill="currentColor"
            />
            <path
                d="M99.8783 18.67H91.2411C90.8193 18.67 90.4257 18.5896 90.0602 18.4289C89.6947 18.2682 89.3742 18.0502 89.0986 17.7747C88.8231 17.4935 88.6066 17.1664 88.4492 16.7934C88.2917 16.4147 88.213 16.0129 88.213 15.5883C88.213 15.1579 88.2917 14.7562 88.4492 14.3832C88.6066 14.0101 88.8231 13.683 89.0986 13.4018C89.3742 13.1206 89.6947 12.8997 90.0602 12.739C90.4257 12.5783 90.8193 12.498 91.2411 12.498H97.2804V14.2626H91.2411C91.0611 14.2626 90.8924 14.2999 90.735 14.3745C90.5775 14.4434 90.4398 14.5381 90.3217 14.6586C90.2036 14.7791 90.1108 14.9197 90.0433 15.0804C89.9759 15.2411 89.9421 15.4104 89.9421 15.5883C89.9421 15.7719 89.9759 15.9441 90.0433 16.1048C90.1108 16.2597 90.2036 16.3974 90.3217 16.5179C90.4398 16.6385 90.5775 16.7331 90.735 16.802C90.8924 16.8709 91.0611 16.9053 91.2411 16.9053H98.1492V12.059C98.1492 11.8811 98.1126 11.7118 98.0395 11.5511C97.9721 11.3904 97.8793 11.2498 97.7612 11.1293C97.6431 11.0088 97.5053 10.9141 97.3479 10.8453C97.1904 10.7707 97.0245 10.7334 96.8502 10.7334H89.9421V8.97731H96.8502C97.272 8.97731 97.6656 9.05765 98.0311 9.21834C98.3966 9.37902 98.7171 9.59996 98.9927 9.88116C99.2682 10.1566 99.4847 10.4808 99.6421 10.8539C99.7996 11.2269 99.8783 11.6286 99.8783 12.059V18.67Z"
                fill="currentColor"
            />
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M40.4768 18.7942H37.8038L31.6671 12.4886L27.9725 15.2043V18.7942H26V6.20184H27.9725V12.9632L37.2927 6.20184H40.2316L33.1836 11.3686L40.4768 18.7942ZM52.258 18.7942H43.4991C43.0618 18.7942 42.6517 18.7108 42.2701 18.543C41.8913 18.3765 41.5581 18.1499 41.2715 17.8634L41.2706 17.8625C40.9839 17.57 40.7588 17.2297 40.5954 16.8425C40.4314 16.4479 40.3493 16.0291 40.3493 15.5883C40.3493 15.142 40.431 14.7235 40.5954 14.334C40.7588 13.9469 40.9839 13.6066 41.2706 13.314C41.5573 13.0215 41.8907 12.7917 42.2701 12.625C42.6517 12.4572 43.0618 12.3738 43.4991 12.3738H49.6601V14.3868H43.4991C43.3362 14.3868 43.1851 14.4205 43.0443 14.4872L43.0426 14.488L43.0409 14.4887C42.8974 14.5515 42.7726 14.6374 42.6658 14.7464C42.5589 14.8555 42.4748 14.9828 42.4132 15.1293C42.3523 15.2743 42.3218 15.4269 42.3218 15.5883C42.3218 15.7556 42.3524 15.9108 42.4129 16.055C42.4742 16.1957 42.5584 16.3205 42.6658 16.4301C42.7726 16.5392 42.8974 16.6251 43.0409 16.6879C43.1825 16.7498 43.3348 16.7811 43.4991 16.7811H50.2855V12.059C50.2855 11.8991 50.2528 11.7476 50.1872 11.6034L50.1864 11.6017L50.1857 11.6C50.1241 11.4535 50.04 11.3262 49.9331 11.2171C49.8263 11.1081 49.7015 11.0222 49.5579 10.9594L49.5563 10.9587L49.5546 10.9579C49.4133 10.8909 49.2649 10.8576 49.1082 10.8576H42.0784V8.85312H49.1082C49.5455 8.85312 49.9556 8.93651 50.3372 9.10427C50.7164 9.27095 51.0497 9.50054 51.3363 9.79287C51.6233 10.0799 51.8485 10.4176 52.0119 10.8047C52.1763 11.1942 52.258 11.6127 52.258 12.059V18.7942ZM51.2507 9.88116C50.9751 9.59996 50.6546 9.37902 50.2891 9.21834C49.9236 9.05765 49.53 8.97731 49.1082 8.97731H42.2001V10.7334H49.1082C49.2826 10.7334 49.4484 10.7707 49.6059 10.8453C49.7633 10.9141 49.9011 11.0088 50.0192 11.1293C50.1373 11.2498 50.2301 11.3904 50.2975 11.5511C50.3706 11.7118 50.4072 11.8811 50.4072 12.059V16.9053H43.4991C43.3192 16.9053 43.1505 16.8709 42.993 16.802C42.8356 16.7331 42.6978 16.6385 42.5797 16.5179C42.4616 16.3974 42.3688 16.2597 42.3014 16.1048C42.2339 15.9441 42.2001 15.7719 42.2001 15.5883C42.2001 15.4104 42.2339 15.2411 42.3014 15.0804C42.3688 14.9197 42.4616 14.7791 42.5797 14.6586C42.6978 14.5381 42.8356 14.4434 42.993 14.3745C43.1505 14.2999 43.3192 14.2626 43.4991 14.2626H49.5384V12.498H43.4991C43.0774 12.498 42.6837 12.5783 42.3182 12.739C41.9527 12.8997 41.6322 13.1206 41.3567 13.4018C41.0811 13.683 40.8646 14.0101 40.7072 14.3832C40.5497 14.7562 40.471 15.1579 40.471 15.5883C40.471 16.0129 40.5497 16.4147 40.7072 16.7934C40.8646 17.1664 41.0811 17.4935 41.3567 17.7747C41.6322 18.0502 41.9527 18.2682 42.3182 18.4289C42.6837 18.5896 43.0774 18.67 43.4991 18.67H52.1363V12.059C52.1363 11.6286 52.0576 11.2269 51.9001 10.8539C51.7427 10.4808 51.5262 10.1566 51.2507 9.88116ZM64.8095 15.758C64.5562 16.3571 64.2105 16.8837 63.7722 17.3369C63.3338 17.7843 62.8201 18.1406 62.2333 18.4048L62.2324 18.4052C61.6429 18.6647 61.0135 18.7942 60.3454 18.7942H56.3437V16.7811H60.3445C60.7449 16.7755 61.1164 16.6955 61.4602 16.5421C61.8124 16.3817 62.1173 16.1694 62.376 15.9055C62.6351 15.6355 62.8404 15.3241 62.992 14.9707C63.1425 14.614 63.218 14.232 63.218 13.8236C63.218 13.4151 63.1424 13.033 62.9918 12.6763C62.8401 12.3114 62.6347 11.9972 62.3765 11.7336L62.3756 11.7327C62.1171 11.4634 61.8127 11.2516 61.4612 11.0971L61.4592 11.0961C61.1159 10.9374 60.7451 10.8576 60.3454 10.8576H55.7183V21.8704H53.7458V8.85312H60.3464C61.0145 8.859 61.6437 8.99425 62.2329 9.25948C62.8202 9.51808 63.3335 9.87409 63.772 10.3274C64.2104 10.7749 64.5563 11.2988 64.8095 11.8979C65.0638 12.4995 65.1906 13.1418 65.1906 13.8236C65.1906 14.5055 65.0636 15.1509 64.8095 15.758ZM63.6856 10.4149C63.2582 9.97297 62.7577 9.62578 62.1842 9.37328C61.6106 9.11504 60.9977 8.98305 60.3454 8.97731H53.8675V21.7462H55.5966V10.7334H60.3454C60.7615 10.7334 61.1495 10.8166 61.5094 10.983C61.8749 11.1437 62.1926 11.3646 62.4625 11.6458C62.7324 11.9213 62.9461 12.2484 63.1036 12.6271C63.261 13.0001 63.3397 13.399 63.3397 13.8236C63.3397 14.2483 63.261 14.6471 63.1036 15.0202C62.9461 15.3874 62.7324 15.7117 62.4625 15.9929C62.1926 16.2683 61.8749 16.4893 61.5094 16.6557C61.1495 16.8164 60.7615 16.8996 60.3454 16.9053H56.4654V18.67H60.3454C60.9977 18.67 61.6106 18.5437 62.1842 18.2912C62.7577 18.033 63.2582 17.6858 63.6856 17.2496C64.1129 16.8078 64.4503 16.2941 64.6977 15.7088C64.9452 15.1177 65.0689 14.4893 65.0689 13.8236C65.0689 13.1579 64.9452 12.5324 64.6977 11.9471C64.4503 11.3617 64.1129 10.851 63.6856 10.4149ZM76.6077 16.7811V18.7942H70.8337C70.1659 18.7883 69.5368 18.656 68.9477 18.3966L68.9468 18.3962C68.36 18.132 67.8469 17.7762 67.4085 17.3288L67.4073 17.3277C66.9749 16.8746 66.6321 16.3482 66.379 15.7494C66.1248 15.1478 65.998 14.5055 65.998 13.8236C65.998 13.1418 66.1248 12.4995 66.379 11.8979C66.6322 11.299 66.9751 10.7752 67.4079 10.3276C67.8465 9.87417 68.3599 9.51807 68.9473 9.25943C69.5365 8.99424 70.1657 8.859 70.8337 8.85312L70.8347 8.85311L74.7569 8.85312C75.1887 8.85312 75.5958 8.93656 75.9772 9.10415C76.3618 9.27074 76.6955 9.5004 76.9769 9.79329C77.2637 10.0802 77.4888 10.4177 77.6521 10.8047C77.8165 11.1942 77.8982 11.6127 77.8982 12.059C77.8982 12.5053 77.8165 12.9238 77.6521 13.3132C77.4887 13.7004 77.2636 14.0407 76.9769 14.3333C76.6954 14.6205 76.3617 14.8473 75.9771 15.0139C75.5958 15.1814 75.1887 15.2649 74.7569 15.2649H68.3375C68.4385 15.4455 68.5564 15.6151 68.6914 15.7737C68.8698 15.9834 69.0696 16.1624 69.2906 16.3109C69.5113 16.4593 69.7511 16.5748 70.0102 16.6575C70.2738 16.7398 70.5484 16.7811 70.8347 16.7811H76.6077ZM69.9744 16.7762C69.7044 16.6901 69.4542 16.5696 69.2237 16.4147C68.9931 16.2597 68.7851 16.0732 68.5995 15.8551C68.4441 15.6725 68.3103 15.4757 68.1983 15.2649C68.1766 15.224 68.1557 15.1826 68.1356 15.1407H74.7569C75.173 15.1407 75.5638 15.0603 75.9293 14.8996C76.3005 14.739 76.621 14.5209 76.8909 14.2454C77.1664 13.9642 77.3829 13.6371 77.5404 13.2641C77.6978 12.8911 77.7765 12.4894 77.7765 12.059C77.7765 11.6286 77.6978 11.2269 77.5404 10.8539C77.3829 10.4808 77.1664 10.1566 76.8909 9.88116C76.621 9.59996 76.3005 9.37902 75.9293 9.21834C75.5638 9.05765 75.173 8.97731 74.7569 8.97731H70.8347C70.1824 8.98305 69.5695 9.11504 68.9959 9.37328C68.4224 9.62578 67.9219 9.97297 67.4945 10.4149C67.0728 10.851 66.7382 11.3617 66.4908 11.9471C66.2434 12.5324 66.1197 13.1579 66.1197 13.8236C66.1197 14.4893 66.2434 15.1148 66.4908 15.7002C66.7382 16.2855 67.0728 16.7991 67.4945 17.241C67.9219 17.6772 68.4224 18.0244 68.9959 18.2826C69.5695 18.5351 70.1824 18.6642 70.8347 18.67H76.486V16.9053H70.8347C70.5367 16.9053 70.2499 16.8623 69.9744 16.7762ZM75.2049 10.9587L75.2033 10.9579C75.062 10.8909 74.9136 10.8576 74.7569 10.8576H70.8347C70.4672 10.8576 70.1228 10.9236 69.8007 11.0551C69.4818 11.1875 69.1958 11.3693 68.9421 11.6007C68.6945 11.8259 68.4865 12.0956 68.3186 12.4106C68.1787 12.6773 68.0811 12.9604 68.0258 13.2604H74.7569C74.915 13.2604 75.0646 13.2293 75.2066 13.1672C75.3502 13.1044 75.4749 13.0185 75.5818 12.9094C75.6886 12.8004 75.7728 12.6731 75.8343 12.5265C75.895 12.3821 75.9257 12.2267 75.9257 12.059C75.9257 11.8976 75.8952 11.745 75.8343 11.6C75.7728 11.4535 75.6886 11.3262 75.5818 11.2171C75.4749 11.1081 75.3502 11.0222 75.2066 10.9594L75.2049 10.9587ZM74.7569 13.3846C74.9312 13.3846 75.0971 13.3502 75.2545 13.2813C75.412 13.2125 75.5498 13.1178 75.6678 12.9973C75.7859 12.8767 75.8787 12.7362 75.9462 12.5755C76.0137 12.4148 76.0474 12.2426 76.0474 12.059C76.0474 11.8811 76.0137 11.7118 75.9462 11.5511C75.8787 11.3904 75.7859 11.2498 75.6678 11.1293C75.5498 11.0088 75.412 10.9141 75.2545 10.8453C75.0971 10.7707 74.9312 10.7334 74.7569 10.7334H70.8347C70.4523 10.7334 70.0924 10.8022 69.7551 10.9399C69.4233 11.0777 69.1253 11.267 68.861 11.5081C68.6023 11.7434 68.3858 12.0246 68.2115 12.3517C68.0619 12.6365 67.9588 12.9395 67.902 13.2604C67.8948 13.3015 67.8883 13.3429 67.8825 13.3846H74.7569ZM82.9338 18.7942H80.9613V10.8576H78.3718V8.85312H80.9613V5.32382H82.9338V8.85312H88.9815V10.8576H82.9338V18.7942ZM82.8121 18.67H81.083V10.7334H78.4935V8.97731H81.083V5.44802H82.8121V8.97731H88.8599V10.7334H82.8121V18.67ZM100 18.7942H91.2411C90.8038 18.7942 90.3937 18.7108 90.0121 18.543C89.6332 18.3765 89.3001 18.1499 89.0135 17.8634L89.0126 17.8625C88.7259 17.57 88.5008 17.2297 88.3374 16.8425C88.1734 16.4479 88.0913 16.0291 88.0913 15.5883C88.0913 15.142 88.173 14.7235 88.3374 14.334C88.5008 13.9469 88.7259 13.6066 89.0126 13.314C89.2993 13.0215 89.6327 12.7917 90.0121 12.625C90.3937 12.4572 90.8038 12.3738 91.2411 12.3738H97.4021V14.3868H91.2411C91.0782 14.3868 90.927 14.4205 90.7862 14.4872L90.7846 14.488L90.7829 14.4887C90.6393 14.5515 90.5146 14.6374 90.4077 14.7464C90.3009 14.8555 90.2167 14.9828 90.1552 15.1293C90.0943 15.2743 90.0638 15.4269 90.0638 15.5883C90.0638 15.7557 90.0944 15.9109 90.1549 16.0551C90.2162 16.1957 90.3003 16.3205 90.4077 16.4301C90.5146 16.5392 90.6393 16.6251 90.7829 16.6879C90.9245 16.7498 91.0768 16.7811 91.2411 16.7811H98.0275V12.059C98.0275 11.8991 97.9947 11.7476 97.9291 11.6034L97.9284 11.6017L97.9277 11.6C97.8661 11.4535 97.782 11.3262 97.6751 11.2171C97.5683 11.1081 97.4435 11.0222 97.2999 10.9594L97.2983 10.9587L97.2966 10.9579C97.1553 10.8909 97.0069 10.8576 96.8502 10.8576H89.8204V8.85312H96.8502C97.2875 8.85312 97.6976 8.93651 98.0792 9.10427C98.4584 9.27098 98.7918 9.50062 99.0784 9.79302C99.3653 10.08 99.5905 10.4176 99.7539 10.8047C99.9183 11.1942 100 11.6127 100 12.059V18.7942ZM98.9927 9.88116C98.7171 9.59996 98.3966 9.37902 98.0311 9.21834C97.6656 9.05765 97.272 8.97731 96.8502 8.97731H89.9421V10.7334H96.8502C97.0245 10.7334 97.1904 10.7707 97.3479 10.8453C97.5053 10.9141 97.6431 11.0088 97.7612 11.1293C97.8793 11.2498 97.9721 11.3904 98.0395 11.5511C98.1126 11.7118 98.1492 11.8811 98.1492 12.059V16.9053H91.2411C91.0611 16.9053 90.8924 16.8709 90.735 16.802C90.5775 16.7331 90.4398 16.6385 90.3217 16.5179C90.2036 16.3974 90.1108 16.2597 90.0433 16.1048C89.9759 15.9441 89.9421 15.7719 89.9421 15.5883C89.9421 15.4104 89.9759 15.2411 90.0433 15.0804C90.1108 14.9197 90.2036 14.7791 90.3217 14.6586C90.4398 14.5381 90.5775 14.4434 90.735 14.3745C90.8924 14.2999 91.0611 14.2626 91.2411 14.2626H97.2804V12.498H91.2411C90.8193 12.498 90.4257 12.5783 90.0602 12.739C89.6947 12.8997 89.3742 13.1206 89.0986 13.4018C88.8231 13.683 88.6066 14.0101 88.4492 14.3832C88.2917 14.7562 88.213 15.1579 88.213 15.5883C88.213 16.0129 88.2917 16.4147 88.4492 16.7934C88.6066 17.1664 88.8231 17.4935 89.0986 17.7747C89.3742 18.0502 89.6947 18.2682 90.0602 18.4289C90.4257 18.5896 90.8193 18.67 91.2411 18.67H99.8783V12.059C99.8783 11.6286 99.7996 11.2269 99.6421 10.8539C99.4847 10.4808 99.2682 10.1566 98.9927 9.88116Z"
                fill="currentColor"
            />
        </svg>
    );
};
