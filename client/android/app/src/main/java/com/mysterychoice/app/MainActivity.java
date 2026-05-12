package com.mysterychoice.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GameDetector.class);
        registerPlugin(Launcher.class);
        super.onCreate(savedInstanceState);
    }
}
