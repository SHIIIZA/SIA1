package com.tripmate.mobile;

import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                WebView webView = getBridge() == null ? null : getBridge().getWebView();
                if (webView != null && webView.canGoBack()) {
                    webView.goBack();
                    return;
                }

                if (webView != null && !isHomePage(webView.getUrl())) {
                    webView.evaluateJavascript(
                            "window.location.replace(new URL('/homepage.html', window.location.origin).href)",
                            null
                    );
                    return;
                }

                setEnabled(false);
                getOnBackPressedDispatcher().onBackPressed();
            }
        });
    }

    private boolean isHomePage(String url) {
        if (url == null) return true;
        String path = Uri.parse(url).getPath();
        return path == null || path.isEmpty() || path.equals("/")
                || path.equals("/index.html") || path.equals("/homepage.html");
    }
}
