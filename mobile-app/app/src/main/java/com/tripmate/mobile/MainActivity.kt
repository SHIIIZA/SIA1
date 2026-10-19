package com.tripmate.mobile

import android.app.Activity
import android.app.AlertDialog
import android.app.DatePickerDialog
import android.content.Intent
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Typeface
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.CheckBox
import android.widget.EditText
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import org.json.JSONArray
import org.json.JSONObject
import java.text.NumberFormat
import java.net.HttpURLConnection
import java.net.URL
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import java.util.Locale
import java.util.concurrent.Executors

class MainActivity : Activity() {
    private val executor = Executors.newSingleThreadExecutor()
    private val imageExecutor = Executors.newFixedThreadPool(3)
    private val mainHandler = Handler(Looper.getMainLooper())
    private lateinit var preferences: android.content.SharedPreferences
    private lateinit var page: LinearLayout
    private lateinit var content: LinearLayout
    private var user: JSONObject? = null
    private var listings = JSONArray()
    private var activeTab = "Explore"
    private var sessionChecked = false
    private var checkIn = LocalDate.now().plusDays(1)
    private var checkOut = LocalDate.now().plusDays(3)
    private var guests = 1
    private var pendingBookingId: Int
        get() = preferences.getInt("pending_booking_id", 0)
        set(value) = preferences.edit().putInt("pending_booking_id", value).apply()
    private var pendingSessionId: String
        get() = preferences.getString("pending_session_id", "").orEmpty()
        set(value) = preferences.edit().putString("pending_session_id", value).apply()

    private val ink = Color.rgb(25, 43, 55)
    private val muted = Color.rgb(99, 114, 124)
    private val green = Color.rgb(7, 138, 116)
    private val canvas = Color.rgb(246, 249, 248)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        preferences = getSharedPreferences("tripmate", MODE_PRIVATE)
        TripMateApi.baseUrl = preferences.getString("api_base_url", BuildConfig.API_BASE_URL).orEmpty()
        TripMateApi.token = preferences.getString("token", null)
        val serializedUser = preferences.getString("user", null)
        user = try {
            serializedUser?.let { JSONObject(it) }
        } catch (_: Exception) {
            null
        }
        renderRoot()
        if (TripMateApi.token.isNullOrBlank()) {
            showAuthentication()
        } else {
            loadCurrentUser()
        }
    }

    override fun onResume() {
        super.onResume()
        if (::content.isInitialized && sessionChecked && user != null &&
            activeTab !in setOf("API settings", "Register", "Sign in")) {
            loadTab(if (pendingBookingId > 0) "Trips" else activeTab)
        }
    }

    override fun onDestroy() {
        executor.shutdown()
        imageExecutor.shutdown()
        super.onDestroy()
    }

    private fun renderRoot() {
        page = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setBackgroundColor(canvas)
        }
        setContentView(page)
        val scroll = ScrollView(this)
        content = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(20), dp(16), dp(20), dp(24))
        }
        scroll.addView(content)
        page.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
    }

    private fun showAuthentication() {
        activeTab = "Sign in"
        if (page.childCount > 1) page.removeViews(1, page.childCount - 1)
        content.removeAllViews()
        text(content, "TripMate", 30, ink, true, top = 28)
        text(content, "Find a stay. Make a memory.", 16, muted, bottom = 24)
        val identifier = input("Email or username")
        val password = input("Password", password = true)
        button(content, "Sign in") {
            val credentials = JSONObject()
                .put("identifier", identifier.text.toString().trim())
                .put("password", password.text.toString())
            runRequest(
                action = { TripMateApi.objectRequest("POST", "/auth/login", credentials) },
                success = { response ->
                    saveSession(response)
                    user = response.optJSONObject("user")
                    activeTab = "Explore"
                    loadTab(activeTab)
                }
            )
        }
        button(content, "Create an account", secondary = true) { showRegistration() }
        button(content, "API connection settings", secondary = true) { showApiSettings() }
    }

    private fun showRegistration() {
        activeTab = "Register"
        content.removeAllViews()
        text(content, "Create your TripMate account", 24, ink, true, bottom = 16)
        val name = input("Full name")
        val email = input("Email address")
        val password = input("Password (at least 8 characters)", password = true)
        button(content, "Create account") {
            val payload = JSONObject()
                .put("name", name.text.toString().trim())
                .put("email", email.text.toString().trim())
                .put("password", password.text.toString())
                .put("role", "guest")
            runRequest(
                action = { TripMateApi.objectRequest("POST", "/auth/register", payload) },
                success = { response ->
                    saveSession(response)
                    user = response.optJSONObject("user")
                    activeTab = "Explore"
                    loadTab(activeTab)
                }
            )
        }
        button(content, "Back to sign in", secondary = true) { showAuthentication() }
    }

    private fun showApiSettings() {
        activeTab = "API settings"
        content.removeAllViews()
        text(content, "API connection", 24, ink, true, bottom = 8)
        text(content, "The app connects to the existing TripMate API. Neon credentials stay on the server.", 14, muted, bottom = 16)
        val address = input("API base URL", initial = TripMateApi.baseUrl)
        button(content, "Save API address") {
            val value = address.text.toString().trim().trimEnd('/')
            if (!(value.startsWith("https://") || value.startsWith("http://"))) {
                toast("Enter an address starting with https:// or http://")
            } else {
                TripMateApi.baseUrl = value
                preferences.edit().putString("api_base_url", value).apply()
                toast("API address saved")
            }
        }
        button(content, "Check connection") {
            runRequest(
                action = { TripMateApi.objectRequest("GET", "/health") },
                success = { health ->
                    val ready = health.optBoolean("databaseConfigured")
                    toast(if (ready) "API and database are available" else "API connected, database is not configured")
                }
            )
        }
        button(content, "Back", secondary = true) {
            if (user != null) loadTab("Account") else showAuthentication()
        }
    }

    private fun showShell() {
        if (page.childCount > 1) page.removeViews(1, page.childCount - 1)
        val nav = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.WHITE)
            setPadding(dp(4), dp(8), dp(4), dp(8))
        }
        listOf("Explore", "Saved", "Trips", "Wallet", "Account").forEach { label ->
            val item = TextView(this).apply {
                text = label
                textSize = 12f
                gravity = Gravity.CENTER
                setTextColor(if (activeTab == label) green else muted)
                setPadding(dp(4), dp(10), dp(4), dp(10))
                setOnClickListener { loadTab(label) }
            }
            nav.addView(item, LinearLayout.LayoutParams(0, -2, 1f))
        }
        page.addView(nav)
    }

    private fun loadTab(tab: String) {
        activeTab = tab
        if (user == null) {
            showAuthentication()
            return
        }
        showShell()
        content.removeAllViews()
        text(content, "TripMate", 26, ink, true)
        when (tab) {
            "Explore" -> loadListings(false)
            "Saved" -> loadWishlist()
            "Trips" -> loadTrips()
            "Wallet" -> loadWallet()
            "Account" -> showAccount()
            else -> loadListings(false)
        }
    }

    private fun loadListings(savedOnly: Boolean) {
        content.removeAllViews()
        text(content, if (savedOnly) "Saved stays" else "Explore stays", 24, ink, true, bottom = 8)
        if (savedOnly) {
            runRequest(
                action = { TripMateApi.arrayRequest("/wishlist") },
                success = { rows ->
                    val items = JSONArray()
                    for (index in 0 until rows.length()) {
                        val row = rows.optJSONObject(index) ?: continue
                        val listing = row.optJSONObject("listings") ?: continue
                        listing.put("_wishlist_id", row.optInt("id"))
                        items.put(listing)
                    }
                    renderListingCards(items, true)
                }
            )
            return
        }
        runRequest(
            action = { TripMateApi.arrayRequest("/listings") },
            success = { rows ->
                listings = rows
                renderListingCards(rows, false)
            }
        )
    }

    private fun renderListingCards(rows: JSONArray, savedOnly: Boolean) {
        content.removeAllViews()
        text(content, if (savedOnly) "Saved stays" else "Explore stays", 24, ink, true, bottom = 8)
        if (!savedOnly) {
            val search = input("Search by name or destination")
            button(content, "Search", secondary = true) {
                val query = search.text.toString().trim().lowercase(Locale.ROOT)
                val filtered = JSONArray()
                val searchSource = listings
                for (index in 0 until searchSource.length()) {
                    val item = searchSource.optJSONObject(index) ?: continue
                    if (query.isBlank() || item.optString("title").lowercase(Locale.ROOT).contains(query) ||
                        item.optString("location").lowercase(Locale.ROOT).contains(query)) filtered.put(item)
                }
                renderListingCards(filtered, false)
            }
        }
        if (rows.length() == 0) {
            text(content, "No stays to show yet.", 15, muted, bottom = 16)
            return
        }
        for (index in 0 until rows.length()) {
            val listing = rows.optJSONObject(index) ?: continue
            val card = panel(content)
            addListingImage(card, listing)
            text(card, listing.optString("title", "Stay"), 19, ink, true)
            text(card, listing.optString("location"), 14, muted, bottom = 8)
            text(card, "${money(listing.optDouble("price_per_night"))} / night · ${listing.optInt("max_guests", 1)} guests", 15, green, true, bottom = 8)
            button(card, "View stay") {
                showListingDetail(listing, savedOnly)
            }
            if (savedOnly) {
                button(card, "Remove from saved", secondary = true) {
                    removeWishlist(listing.optInt("_wishlist_id"))
                }
            }
        }
    }

    private fun showListingDetail(listing: JSONObject, fromSaved: Boolean) {
        activeTab = "Detail"
        content.removeAllViews()
        text(content, listing.optString("title"), 25, ink, true)
        text(content, listing.optString("location"), 15, muted, bottom = 12)
        text(content, listing.optString("description", "A TripMate stay in the Philippines."), 15, ink, bottom = 12)
        text(content, "${money(listing.optDouble("price_per_night"))} per night", 18, green, true)
        text(content, "Up to ${listing.optInt("max_guests", 1)} guests · ${listing.optInt("bedrooms", 1)} bedrooms · ${listing.optInt("bathrooms", 1)} bathrooms", 14, muted, bottom = 16)
        button(content, "Choose check-in: $checkIn", secondary = true) {
            showDatePicker(checkIn) { date ->
                checkIn = date
                if (checkOut <= checkIn) checkOut = checkIn.plusDays(1)
                showListingDetail(listing, fromSaved)
            }
        }
        button(content, "Choose check-out: $checkOut", secondary = true) {
            showDatePicker(checkOut, checkIn.plusDays(1)) { date ->
                checkOut = date
                showListingDetail(listing, fromSaved)
            }
        }
        text(content, "Guests: $guests", 16, ink, true, bottom = 8)
        val guestActions = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        button(guestActions, "−", secondary = true) {
            if (guests > 1) guests--
            showListingDetail(listing, fromSaved)
        }
        button(guestActions, "+", secondary = true) {
            if (guests < listing.optInt("max_guests", 1)) guests++
            showListingDetail(listing, fromSaved)
        }
        content.addView(guestActions)
        val days = ChronoUnit.DAYS.between(checkIn, checkOut).coerceAtLeast(1)
        val subtotal = listing.optDouble("price_per_night") * days
        val cleaning = listing.optDouble("cleaning_fee")
        val service = roundPeso((subtotal + cleaning) * 0.10)
        val taxes = roundPeso(subtotal * 0.1125)
        val total = subtotal + cleaning + service + taxes
        text(content, "Estimated total: ${money(total)} ($days nights, fees and taxes included)", 16, ink, true, top = 12, bottom = 12)
        val acceptedTerms = CheckBox(this).apply {
            setText(R.string.booking_terms)
            setTextColor(ink)
        }
        content.addView(acceptedTerms)
        button(content, "Continue to secure payment") {
            if (!acceptedTerms.isChecked) {
                toast("Please accept the booking terms.")
                return@button
            }
            createCheckout(listing, subtotal, cleaning, service, taxes, total)
        }
        button(content, "Save this stay", secondary = true) { addWishlist(listing) }
        button(content, "Back to stays", secondary = true) { loadTab(if (fromSaved) "Saved" else "Explore") }
    }

    private fun createCheckout(
        listing: JSONObject,
        subtotal: Double,
        cleaning: Double,
        service: Double,
        taxes: Double,
        total: Double
    ) {
        val payload = JSONObject()
            .put("listing_id", listing.optInt("id"))
            .put("check_in", checkIn.toString())
            .put("check_out", checkOut.toString())
            .put("guest_count", guests)
            .put("subtotal", subtotal)
            .put("cleaning_fee", cleaning)
            .put("service_fee", service)
            .put("taxes", taxes)
            .put("total_amount", roundPeso(total))
            .put("payment_method", "qrph")
            .put("terms_accepted", true)
        runRequest(
            action = { TripMateApi.objectRequest("POST", "/payments/checkout", payload) },
            success = { response ->
                pendingBookingId = response.optInt("booking_id")
                pendingSessionId = response.optString("session_id")
                val checkoutUrl = response.optString("checkout_url")
                if (pendingBookingId <= 0 || pendingSessionId.isBlank() || checkoutUrl.isBlank()) {
                    toast("The API returned incomplete checkout information.")
                    return@runRequest
                }
                try {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(checkoutUrl)))
                    toast("Complete payment in the browser, then return to Trips and check payment.")
                } catch (_: Exception) {
                    toast("Could not open the payment page.")
                }
            }
        )
    }

    private fun loadWishlist() {
        content.removeAllViews()
        text(content, "Saved stays", 24, ink, true)
        runRequest(
            action = { TripMateApi.arrayRequest("/wishlist") },
            success = { rows ->
                val items = JSONArray()
                for (index in 0 until rows.length()) {
                    val row = rows.optJSONObject(index) ?: continue
                    row.optJSONObject("listings")?.let {
                        it.put("_wishlist_id", row.optInt("id"))
                        items.put(it)
                    }
                }
                renderListingCards(items, true)
            }
        )
    }

    private fun addWishlist(listing: JSONObject) {
        runRequest(
            action = {
                TripMateApi.objectRequest("POST", "/wishlist", JSONObject().put("listing_id", listing.optInt("id")))
            },
            success = {
                toast("Stay saved.")
                if (activeTab == "Saved") loadWishlist()
            }
        )
    }

    private fun removeWishlist(wishlistId: Int) {
        if (wishlistId <= 0) {
            toast("Unable to find the saved stay.")
            return
        }
        runRequest(
            action = {
                TripMateApi.request("DELETE", "/wishlist/$wishlistId")
                Unit
            },
            success = {
                toast("Stay removed from saved.")
                loadWishlist()
            }
        )
    }

    private fun loadTrips() {
        content.removeAllViews()
        text(content, "My trips", 24, ink, true, bottom = 8)
        if (pendingBookingId > 0) {
            button(content, "Check latest payment", secondary = true) { confirmLatestPayment() }
        }
        runRequest(
            action = {
                val bookings = TripMateApi.arrayRequest("/bookings")
                val allListings = TripMateApi.arrayRequest("/listings")
                val listingMap = mutableMapOf<Int, JSONObject>()
                for (index in 0 until allListings.length()) {
                    allListings.optJSONObject(index)?.let { listingMap[it.optInt("id")] = it }
                }
                bookings to listingMap
            },
            success = { result ->
                val (bookings, listingMap) = result
                if (bookings.length() == 0) {
                    text(content, "Your trips will appear here after booking.", 15, muted)
                    return@runRequest
                }
                for (index in 0 until bookings.length()) {
                    val booking = bookings.optJSONObject(index) ?: continue
                    val card = panel(content)
                    val listing = listingMap[booking.optInt("listing_id")]
                    text(card, listing?.optString("title") ?: "Trip #${booking.optInt("id")}", 18, ink, true)
                    text(card, "${booking.optString("check_in")} → ${booking.optString("check_out")}", 14, muted)
                    text(card, "${money(booking.optDouble("total_amount"))} · ${booking.optString("status")}", 15, green, true, bottom = 8)
                    if (booking.optString("status") == "pending") {
                        button(card, "Check payment", secondary = true) {
                            confirmPayment(booking.optInt("id"))
                        }
                    }
                    if (booking.optString("status") != "cancelled" && booking.optString("status") != "completed") {
                        button(card, "Cancel trip") { cancelBooking(booking.optInt("id")) }
                    }
                }
            }
        )
    }

    private fun confirmLatestPayment() {
        val bookingId = pendingBookingId
        if (bookingId <= 0) {
            toast("There is no recent payment to check.")
            return
        }
        confirmPayment(bookingId)
    }

    private fun confirmPayment(bookingId: Int) {
        runRequest(
            action = {
                val session = if (pendingBookingId == bookingId) pendingSessionId else ""
                val sessionQuery = if (session.isBlank()) "" else "&session_id=${Uri.encode(session)}"
                TripMateApi.objectRequest("GET", "/payments/confirm?booking_id=$bookingId$sessionQuery")
            },
            success = {
                if (pendingBookingId == bookingId) {
                    pendingBookingId = 0
                    pendingSessionId = ""
                }
                toast("Payment confirmed. Your trip is booked.")
                loadTrips()
            }
        )
    }

    private fun cancelBooking(bookingId: Int) {
        AlertDialog.Builder(this)
            .setTitle("Cancel this trip?")
            .setMessage("Any eligible refund for a paid booking will be credited to your TripMate Wallet according to the cancellation policy.")
            .setNegativeButton("Keep trip", null)
            .setPositiveButton("Cancel trip") { _, _ ->
                runRequest(
                    action = { TripMateApi.request("PATCH", "/bookings/$bookingId/cancel") },
                    success = {
                        toast("Trip cancelled. Any eligible credit appears in your wallet.")
                        loadTrips()
                    }
                )
            }
            .show()
    }

    private fun loadWallet() {
        content.removeAllViews()
        text(content, "TripMate Wallet", 24, ink, true, bottom = 8)
        runRequest(
            action = { TripMateApi.objectRequest("GET", "/wallet") },
            success = { wallet ->
                text(content, "Balance", 14, muted)
                text(content, money(wallet.optDouble("balance")), 30, green, true, bottom = 16)
                val transactions = wallet.optJSONArray("transactions") ?: JSONArray()
                if (transactions.length() == 0) text(content, "No wallet activity yet.", 15, muted)
                for (index in 0 until transactions.length()) {
                    val row = transactions.optJSONObject(index) ?: continue
                    val card = panel(content)
                    text(card, row.optString("description"), 15, ink, true)
                    text(card, "+${money(row.optDouble("amount"))}", 16, green, true, bottom = 4)
                    text(card, row.optString("created_at"), 12, muted)
                }
            }
        )
    }

    private fun showAccount() {
        content.removeAllViews()
        text(content, "Account", 24, ink, true, bottom = 8)
        text(content, "Changes here sync to your TripMate website account.", 14, muted, bottom = 12)
        val name = input("Full name", initial = user?.optString("name").orEmpty())
        val email = input("Email address", initial = user?.optString("email").orEmpty())
        val phone = input("Phone number", initial = user?.optString("phone").orEmpty())
        button(content, "Save account changes") {
            val nameValue = name.text.toString().trim()
            val emailValue = email.text.toString().trim()
            if (nameValue.isBlank() || emailValue.isBlank()) {
                toast("Name and email are required.")
                return@button
            }
            val updates = JSONObject()
                .put("name", nameValue)
                .put("email", emailValue)
                .put("phone", phone.text.toString().trim())
            runRequest(
                action = { TripMateApi.objectRequest("PATCH", "/me", updates) },
                success = { response ->
                    user = response.optJSONObject("user")
                    preferences.edit().putString("user", user?.toString()).apply()
                    toast("Account updated. The website will show these changes too.")
                    showAccount()
                }
            )
        }
        button(content, "API connection settings", secondary = true) { showApiSettings() }
        button(content, "Sign out") {
            TripMateApi.token = null
            user = null
            preferences.edit().remove("token").remove("user").apply()
            showAuthentication()
        }
    }

    private fun loadCurrentUser() {
        runRequest(
            action = { TripMateApi.objectRequest("GET", "/me") },
            success = { result ->
                sessionChecked = true
                user = result.optJSONObject("user")
                preferences.edit().putString("user", user?.toString()).apply()
                loadTab("Explore")
            },
            failure = {
                sessionChecked = true
                TripMateApi.token = null
                preferences.edit().remove("token").remove("user").apply()
                user = null
                showAuthentication()
            }
        )
    }

    private fun saveSession(response: JSONObject) {
        val token = response.optString("token")
        val sessionUser = response.optJSONObject("user")
        if (token.isBlank() || sessionUser == null) {
            toast("The API returned an incomplete login response.")
            return
        }
        TripMateApi.token = token
        user = sessionUser
        sessionChecked = true
        preferences.edit().putString("token", token).putString("user", sessionUser.toString()).apply()
    }

    private fun showDatePicker(initial: LocalDate, minimum: LocalDate? = null, onSelected: (LocalDate) -> Unit) {
        DatePickerDialog(
            this,
            { _, year, month, day -> onSelected(LocalDate.of(year, month + 1, day)) },
            initial.year,
            initial.monthValue - 1,
            initial.dayOfMonth
        ).apply {
            datePicker.minDate = (minimum ?: LocalDate.now()).atStartOfDay(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
            show()
        }
    }

    private fun <T : Any?> runRequest(
        action: () -> T,
        success: (T) -> Unit,
        failure: (Exception) -> Unit = { toast(it.message ?: "Request failed.") }
    ) {
        toast("Loading…", short = true)
        executor.execute {
            try {
                val result = action()
                mainHandler.post { success(result) }
            } catch (error: Exception) {
                mainHandler.post { failure(error) }
            }
        }
    }

    private fun input(label: String, password: Boolean = false, initial: String = ""): EditText {
        return EditText(this).apply {
            hint = label
            setText(initial)
            textSize = 16f
            setSingleLine(!label.contains("Search", ignoreCase = true))
            if (password) inputType = android.text.InputType.TYPE_CLASS_TEXT or android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD
            else inputType = android.text.InputType.TYPE_CLASS_TEXT
            imeOptions = EditorInfo.IME_ACTION_DONE
            setPadding(dp(14), dp(10), dp(14), dp(10))
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.WHITE)
                cornerRadius = dp(12).toFloat()
                setStroke(dp(1), Color.rgb(224, 231, 230))
            }
            content.addView(this, LinearLayout.LayoutParams(-1, -2).apply {
                bottomMargin = dp(10)
            })
        }
    }

    private fun text(
        parent: LinearLayout,
        value: String,
        size: Int,
        color: Int,
        bold: Boolean = false,
        top: Int = 0,
        bottom: Int = 8
    ): TextView {
        return TextView(this).apply {
            text = value
            textSize = size.toFloat()
            setTextColor(color)
            if (bold) setTypeface(typeface, Typeface.BOLD)
            setPadding(0, dp(top), 0, dp(bottom))
            parent.addView(this, LinearLayout.LayoutParams(-1, -2))
        }
    }

    private fun button(parent: LinearLayout, label: String, secondary: Boolean = false, action: () -> Unit): Button {
        return Button(this).apply {
            text = label
            textSize = 14f
            isAllCaps = false
            setTextColor(if (secondary) ink else Color.WHITE)
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(if (secondary) Color.WHITE else green)
                cornerRadius = dp(12).toFloat()
                if (secondary) setStroke(dp(1), Color.rgb(218, 228, 225))
            }
            setOnClickListener { action() }
            val width = if (parent.orientation == LinearLayout.HORIZONTAL) 0 else -1
            val params = if (parent.orientation == LinearLayout.HORIZONTAL) {
                LinearLayout.LayoutParams(width, dp(48), 1f)
            } else {
                LinearLayout.LayoutParams(width, dp(48))
            }
            parent.addView(this, params.apply {
                bottomMargin = dp(8)
                if (parent.orientation == LinearLayout.HORIZONTAL) marginEnd = dp(8)
            })
        }
    }

    private fun addListingImage(parent: LinearLayout, listing: JSONObject) {
        val images = listing.optJSONArray("images")
        val imageUrl = images?.optString(0).orEmpty()
        if (!imageUrl.startsWith("https://")) return

        val imageView = ImageView(this).apply {
            tag = imageUrl
            scaleType = ImageView.ScaleType.CENTER_CROP
            setBackgroundColor(Color.rgb(230, 237, 235))
            contentDescription = listing.optString("title")
        }
        parent.addView(imageView, LinearLayout.LayoutParams(-1, dp(160)).apply {
            bottomMargin = dp(10)
        })
        imageExecutor.execute {
            var connection: HttpURLConnection? = null
            try {
                val imageConnection = URL(imageUrl).openConnection() as HttpURLConnection
                connection = imageConnection
                imageConnection.connectTimeout = 8_000
                imageConnection.readTimeout = 8_000
                val bitmap = imageConnection.inputStream.use { BitmapFactory.decodeStream(it) }
                mainHandler.post {
                    if (imageView.tag == imageUrl && bitmap != null) imageView.setImageBitmap(bitmap)
                }
            } catch (_: Exception) {
                mainHandler.post { imageView.setBackgroundColor(Color.rgb(230, 237, 235)) }
            } finally {
                connection?.disconnect()
            }
        }
    }

    private fun panel(parent: LinearLayout): LinearLayout {
        return LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(16), dp(14), dp(16), dp(8))
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.WHITE)
                cornerRadius = dp(16).toFloat()
                setStroke(dp(1), Color.rgb(231, 237, 235))
            }
            parent.addView(this, LinearLayout.LayoutParams(-1, -2).apply {
                bottomMargin = dp(12)
            })
        }
    }

    private fun toast(message: String, short: Boolean = false) {
        Toast.makeText(this, message, if (short) Toast.LENGTH_SHORT else Toast.LENGTH_LONG).show()
    }

    private fun money(amount: Double): String {
        return NumberFormat.getCurrencyInstance(Locale("en", "PH")).format(amount)
    }

    private fun roundPeso(amount: Double): Double = kotlin.math.floor(amount + 0.5)

    private fun dp(value: Int): Int = (value * resources.displayMetrics.density).toInt()
}
