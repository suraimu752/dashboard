package com.dashboard.app

import android.annotation.SuppressLint
import android.net.http.SslError
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.SslErrorHandler
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.Toast
import java.net.URL
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import com.dashboard.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var webView: WebView
    private lateinit var progressBar: ProgressBar

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        webView = binding.webView
        progressBar = binding.progressBar

        setupWindow()
        setupWebView()
        setupBackPress()
        loadDashboard()
    }

    private fun setupBackPress() {
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    private fun setupWindow() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        hideSystemBars()
    }

    private fun hideSystemBars() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.apply {
                hide(android.view.WindowInsets.Type.statusBars() or android.view.WindowInsets.Type.navigationBars())
                systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            )
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val dashboardHost = getDashboardHost()
        webView.apply {
            webViewClient = object : WebViewClient() {
                override fun onPageFinished(view: WebView?, url: String?) {
                    progressBar.visibility = View.GONE
                }
                override fun onReceivedSslError(
                    view: WebView?,
                    handler: SslErrorHandler?,
                    error: SslError?
                ) {
                    // 自己署名証明書のダッシュボードに接続するため、設定したホストのみ許可
                    val errorUrl = error?.url ?: ""
                    if (dashboardHost != null && handler != null && isSameHost(errorUrl, dashboardHost)) {
                        handler.proceed()
                    } else {
                        handler?.cancel()
                        progressBar.visibility = View.GONE
                        Toast.makeText(
                            this@MainActivity,
                            getString(R.string.ssl_error),
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
                override fun onReceivedError(
                    view: WebView?,
                    request: WebResourceRequest?,
                    error: android.webkit.WebResourceError?
                ) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && request?.isForMainFrame == true) {
                        progressBar.visibility = View.GONE
                        Toast.makeText(
                            this@MainActivity,
                            getString(R.string.load_error, request.url.toString()),
                            Toast.LENGTH_LONG
                        ).show()
                    }
                }
            }
            webChromeClient = WebChromeClient()
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                cacheMode = WebSettings.LOAD_DEFAULT
                mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
                allowFileAccess = false
                allowContentAccess = true
            }
        }
    }

    private fun getDashboardHost(): String? {
        val urlStr = PreferenceHelper.getDashboardUrl(this)
        if (urlStr.isBlank()) return null
        return try {
            URL(urlStr).host
        } catch (_: Exception) {
            null
        }
    }

    private fun isSameHost(errorUrl: String, expectedHost: String): Boolean {
        return try {
            URL(errorUrl).host.equals(expectedHost, ignoreCase = true)
        } catch (_: Exception) {
            false
        }
    }

    private fun loadDashboard() {
        val baseUrl = PreferenceHelper.getDashboardUrl(this)
        if (baseUrl.isNotBlank()) {
            val url = if (baseUrl.contains("?")) "$baseUrl&fullscreen=1" else "$baseUrl?fullscreen=1"
            webView.loadUrl(url)
        } else {
            progressBar.visibility = View.GONE
            Toast.makeText(this, R.string.url_not_configured, Toast.LENGTH_LONG).show()
        }
    }

}
