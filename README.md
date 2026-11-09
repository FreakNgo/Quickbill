# QuickBill

Fast billing and a UPI payment QR for small shops. It runs in the
browser, keeps everything on your device, and needs no server or
sign-up.

Made by Rajveer Nanadikar | Antify Studio


## Quick start

1. Open Settings.
2. Enter your shop name, UPI ID (name@bank) and address or tagline.
3. Choose your paper width: 58 mm or 80 mm.
4. Add your products (name and price). Tick Pin to keep an item at
   the top of the Bill screen.
5. Go to Bill and start selling.


## Taking a bill

1. Tap an item to add it. Use + and - on the card to change the
   quantity. Tap the pin icon to pin or unpin an item.
2. For anything not in your list, tap Custom item, then enter an
   optional name, the price and the quantity.
3. Add a discount in the Current bill box if you need one.
4. Tap Generate bill & QR. The bill is saved automatically.
5. Show the QR to the customer. Any UPI app can scan it and the amount
   is locked. The QR is shown on every bill, cash bills too.
6. Choose Paid by: UPI or Cash. This is only your own record.
7. Print the receipt if you want one, then tap New bill for the next
   customer. Edit bill takes you back to change the same bill.


## History

- The Today card shows today's total, split into cash and UPI.
- Tap any bill to open its full receipt and QR again.
- You can print it, change Paid by, or delete it from there.
- Use Delete on a bill, or Delete all, to remove saved bills.


## Printing

Print receipt
  Opens the print dialog of your device. Pick your thermal printer
  there. Set 58 mm or 80 mm in Settings first.

Print via Bluetooth
  Android Chrome only. Works with Bluetooth Low Energy (BLE) printers.
  Tap the button and choose your printer. Printers that only support
  classic Bluetooth are not supported, so use Print receipt instead.


## Install on a phone

1. Upload all the files, in one folder, to any HTTPS static host
   (GitHub Pages, Netlify, Cloudflare Pages and similar).
2. Open the link on your phone.
3. Use Add to Home Screen (iPhone: Share, then Add to Home Screen).

Installing and offline use need HTTPS. To just try the app, open
index.html in a browser.


## Files

  index.html       the app page (logos and icons are built in)
  styles.css       styles
  app.js           app logic
  sw.js            offline cache
  manifest.json    install settings
  README.md        this guide
  PRIVACY.md       privacy policy


## Updating

After you upload new files, change the cache name in sw.js (for
example quickbill-v4) so installed copies pick up the update.


## Your data

Bills, products and settings live in the local storage of your browser
on your device. Clearing browser data or removing the app deletes
them. There is no built-in backup. See PRIVACY.md.


## Browsers

Current Chrome, Edge, Safari and Firefox. Bluetooth printing needs
Chrome on Android.
