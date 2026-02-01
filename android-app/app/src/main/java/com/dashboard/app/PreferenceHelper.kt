package com.dashboard.app

import android.content.Context
import android.content.SharedPreferences

object PreferenceHelper {
    private const val PREFS_NAME = "dashboard_prefs"
    private const val KEY_DASHBOARD_URL = "dashboard_url"

    private fun prefs(context: Context): SharedPreferences {
        return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    }

    fun getDashboardUrl(context: Context): String {
        val defaultUrl = context.getString(R.string.default_dashboard_url)
        return prefs(context).getString(KEY_DASHBOARD_URL, defaultUrl) ?: defaultUrl
    }

    fun setDashboardUrl(context: Context, url: String) {
        prefs(context).edit().putString(KEY_DASHBOARD_URL, url).apply()
    }
}
