<?php

return [

    /*
    |--------------------------------------------------------------------------
    | AI Worker / Tracking Configuration
    |--------------------------------------------------------------------------
    |
    | Shared configuration consumed by the backend to describe how the AI
    | worker produced tracking data, and how derived analytics (movement
    | prediction, player role inference) behave.
    |
    */

    'FRAME_SAMPLE_RATE' => (int) env('FRAME_SAMPLE_RATE', 5),

    'predict' => [
        'lookback' => (int) env('AI_PREDICT_LOOKBACK', 3),
        'horizon' => (int) env('AI_PREDICT_HORIZON', 2),
    ],

    'roles' => [
        'vocabulary' => [
            'GK' => 'GK',
            'DEF' => 'DEF',
            'MID' => 'MID',
            'ATT' => 'ATT',
        ],
    ],

];
